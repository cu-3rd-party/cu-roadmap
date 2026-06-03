package store

import (
	"sync"
	"time"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type MemoryCacheStore struct {
	mu         sync.RWMutex
	authTokens map[uuid.UUID]models.AuthToken
}

func NewMemoryCacheStore() *MemoryCacheStore {
	return &MemoryCacheStore{authTokens: make(map[uuid.UUID]models.AuthToken)}
}

func (s *MemoryCacheStore) Init() error  { return nil }
func (s *MemoryCacheStore) Close() error { return nil }

func (s *MemoryCacheStore) ClearAll() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.authTokens = make(map[uuid.UUID]models.AuthToken)
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
