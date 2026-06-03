package store

import (
	"context"
	"errors"
	"fmt"
	"strconv"
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

func (s *RedisCacheStore) AllowRateLimit(key string, capacity int, refillPerSecond float64) (bool, float64, error) {
	result, err := redisRateLimitScript.Run(
		context.Background(),
		s.client,
		[]string{rateLimitBucketKey(key)},
		capacity,
		refillPerSecond,
		time.Now().UnixMilli(),
	).Result()
	if err != nil {
		return false, 0, err
	}
	values, ok := result.([]interface{})
	if !ok || len(values) != 2 {
		return false, 0, fmt.Errorf("unexpected rate limit result")
	}
	allowed, ok := values[0].(int64)
	if !ok {
		return false, 0, fmt.Errorf("unexpected rate limit flag")
	}
	retryAfter, err := toFloat64(values[1])
	if err != nil {
		return false, 0, err
	}
	return allowed == 1, retryAfter, nil
}

func authTokenCacheKey(token uuid.UUID) string {
	return "auth-token:" + token.String()
}

func cacheEntryKey(key string) string {
	return "cache:" + strings.ReplaceAll(key, " ", "%20")
}

func rateLimitBucketKey(key string) string {
	return "rate-limit-bucket:" + key
}

func toFloat64(value interface{}) (float64, error) {
	switch v := value.(type) {
	case float64:
		return v, nil
	case int64:
		return float64(v), nil
	case string:
		return strconv.ParseFloat(v, 64)
	default:
		return 0, fmt.Errorf("unexpected float result type %T", value)
	}
}

var redisRateLimitScript = redis.NewScript(`
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_per_second = tonumber(ARGV[2])
local now_ms = tonumber(ARGV[3])

local data = redis.call('HMGET', key, 'tokens', 'updated_ms')
local tokens = tonumber(data[1])
local updated_ms = tonumber(data[2])

if tokens == nil then
  tokens = capacity
  updated_ms = now_ms
end

local elapsed = math.max(0, now_ms - updated_ms) / 1000
tokens = math.min(capacity, tokens + elapsed * refill_per_second)

local allowed = 0
local retry_after = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
else
  retry_after = (1 - tokens) / refill_per_second
end

redis.call('HSET', key, 'tokens', tokens, 'updated_ms', now_ms)
redis.call('PEXPIRE', key, math.ceil((capacity / refill_per_second) * 2000))

return {allowed, retry_after}
`)
