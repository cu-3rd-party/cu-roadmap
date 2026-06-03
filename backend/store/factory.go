package store

import "github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"

var (
	globalStore      interfaces.StoreBase
	globalCacheStore interfaces.CacheStoreBase
)

func InitStore(useMemory bool, databaseURL string, password string, useMemoryCache bool, redisURL string) (interfaces.StoreBase, error) {
	if useMemory {
		globalStore = NewMemoryStore()
	} else {
		globalStore = NewPostgresStore(databaseURL)
	}
	if err := globalStore.Init(password); err != nil {
		return nil, err
	}
	if useMemoryCache {
		globalCacheStore = NewMemoryCacheStore()
	} else {
		globalCacheStore = NewRedisCacheStore(redisURL)
	}
	if err := globalCacheStore.Init(); err != nil {
		_ = globalStore.Close()
		globalStore = nil
		globalCacheStore = nil
		return nil, err
	}
	return globalStore, nil
}

func GetStore() interfaces.StoreBase {
	return globalStore
}

func GetCacheStore() interfaces.CacheStoreBase {
	return globalCacheStore
}

func CloseStore() error {
	var err error
	if globalCacheStore != nil {
		err = globalCacheStore.Close()
		globalCacheStore = nil
	}
	if globalStore != nil {
		storeErr := globalStore.Close()
		globalStore = nil
		if err == nil {
			err = storeErr
		}
	}
	return err
}

func SetStoreForTest(s interfaces.StoreBase) {
	globalStore = s
}

func SetCacheStoreForTest(s interfaces.CacheStoreBase) {
	globalCacheStore = s
}
