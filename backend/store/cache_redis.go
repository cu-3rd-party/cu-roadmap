package store

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type RedisCacheStore struct {
	client   *redis.Client
	redisURL string
}

func NewRedisCacheStore(redisURL string) *RedisCacheStore {
	return &RedisCacheStore{redisURL: redisURL}
}

func (s *RedisCacheStore) Init() error {
	options, err := redis.ParseURL(s.redisURL)
	if err != nil {
		return err
	}
	s.client = redis.NewClient(options)
	return s.client.Ping(context.Background()).Err()
}

func (s *RedisCacheStore) Close() error {
	if s.client == nil {
		return nil
	}
	return s.client.Close()
}

func (s *RedisCacheStore) ClearAll() error {
	return s.client.FlushDB(context.Background()).Err()
}

func (s *RedisCacheStore) CreateAuthToken() (*models.AuthToken, error) {
	token := models.AuthToken{Token: uuid.New(), Ttl: time.Now().Unix() + interfaces.AuthTokenLifetime}
	ttl := time.Until(time.Unix(token.Ttl, 0))
	if ttl <= 0 {
		ttl = time.Second
	}
	if err := s.client.Set(context.Background(), authTokenCacheKey(token.Token), token.Ttl, ttl).Err(); err != nil {
		return nil, err
	}
	return &token, nil
}

func (s *RedisCacheStore) CheckAuthToken(token uuid.UUID) (bool, error) {
	_, err := s.client.Get(context.Background(), authTokenCacheKey(token)).Result()
	if errors.Is(err, redis.Nil) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (s *RedisCacheStore) Get(key string) ([]byte, bool, error) {
	value, err := s.client.Get(context.Background(), cacheEntryKey(key)).Bytes()
	if errors.Is(err, redis.Nil) {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, err
	}
	return value, true, nil
}

func (s *RedisCacheStore) Set(key string, value []byte, ttlSeconds int64) error {
	return s.client.Set(context.Background(), cacheEntryKey(key), value, time.Duration(ttlSeconds)*time.Second).Err()
}

func (s *RedisCacheStore) DeleteByPrefix(prefix string) error {
	ctx := context.Background()
	pattern := cacheEntryKey(prefix) + "*"
	iter := s.client.Scan(ctx, 0, pattern, 0).Iterator()
	keys := make([]string, 0)
	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
	}
	if err := iter.Err(); err != nil {
		return err
	}
	if len(keys) == 0 {
		return nil
	}
	return s.client.Del(ctx, keys...).Err()
}

func authTokenCacheKey(token uuid.UUID) string {
	return "auth-token:" + token.String()
}

func cacheEntryKey(key string) string {
	return "cache:" + strings.ReplaceAll(key, " ", "%20")
}
