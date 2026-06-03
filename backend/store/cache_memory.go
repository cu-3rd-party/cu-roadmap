package store

import (
	"strings"
	"sync"
	"time"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type MemoryCacheStore struct {
	mu         sync.RWMutex
	authTokens map[uuid.UUID]models.AuthToken
	entries    map[string]memoryCacheEntry
	buckets    map[string]memoryRateLimitBucket
}

type memoryCacheEntry struct {
	value   []byte
	expires int64
}

type memoryRateLimitBucket struct {
	tokens       float64
	updatedNanos int64
}

func NewMemoryCacheStore() *MemoryCacheStore {
	return &MemoryCacheStore{
		authTokens: make(map[uuid.UUID]models.AuthToken),
		entries:    make(map[string]memoryCacheEntry),
		buckets:    make(map[string]memoryRateLimitBucket),
	}
}

func (s *MemoryCacheStore) Init() error  { return nil }
func (s *MemoryCacheStore) Close() error { return nil }

func (s *MemoryCacheStore) ClearAll() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.authTokens = make(map[uuid.UUID]models.AuthToken)
	s.entries = make(map[string]memoryCacheEntry)
	s.buckets = make(map[string]memoryRateLimitBucket)
	return nil
}

func (s *MemoryCacheStore) CreateAuthToken() (*models.AuthToken, error) {
	token := models.AuthToken{Token: uuid.New(), Ttl: time.Now().Unix() + interfaces.AuthTokenLifetime}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.authTokens[token.Token] = token
	return &token, nil
}

func (s *MemoryCacheStore) CheckAuthToken(token uuid.UUID) (bool, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	authToken, ok := s.authTokens[token]
	if !ok {
		return false, nil
	}
	return authToken.Ttl > time.Now().Unix(), nil
}

func (s *MemoryCacheStore) Get(key string) ([]byte, bool, error) {
	s.mu.RLock()
	entry, ok := s.entries[key]
	s.mu.RUnlock()
	if !ok {
		return nil, false, nil
	}
	if entry.expires <= time.Now().Unix() {
		s.mu.Lock()
		delete(s.entries, key)
		s.mu.Unlock()
		return nil, false, nil
	}
	value := make([]byte, len(entry.value))
	copy(value, entry.value)
	return value, true, nil
}

func (s *MemoryCacheStore) Set(key string, value []byte, ttlSeconds int64) error {
	entry := memoryCacheEntry{value: make([]byte, len(value)), expires: time.Now().Unix() + ttlSeconds}
	copy(entry.value, value)
	s.mu.Lock()
	defer s.mu.Unlock()
	s.entries[key] = entry
	return nil
}

func (s *MemoryCacheStore) DeleteByPrefix(prefix string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for key := range s.entries {
		if strings.HasPrefix(key, prefix) {
			delete(s.entries, key)
		}
	}
	return nil
}

func (s *MemoryCacheStore) AllowRateLimit(key string, capacity int, refillPerSecond float64) (bool, float64, error) {
	nowNanos := time.Now().UnixNano()
	s.mu.Lock()
	defer s.mu.Unlock()
	bucket, ok := s.buckets[key]
	if !ok {
		bucket = memoryRateLimitBucket{tokens: float64(capacity), updatedNanos: nowNanos}
	}
	elapsed := float64(nowNanos-bucket.updatedNanos) / float64(time.Second)
	if elapsed > 0 {
		bucket.tokens = minFloat64(float64(capacity), bucket.tokens+elapsed*refillPerSecond)
	}
	bucket.updatedNanos = nowNanos
	if bucket.tokens >= 1 {
		bucket.tokens--
		s.buckets[key] = bucket
		return true, 0, nil
	}
	retryAfter := (1 - bucket.tokens) / refillPerSecond
	s.buckets[key] = bucket
	return false, retryAfter, nil
}

func minFloat64(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}
