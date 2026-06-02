package store

import "github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"

var globalStore interfaces.StoreBase

func InitStore(useMemory bool, databaseURL string, password string) (interfaces.StoreBase, error) {
	if useMemory {
		globalStore = NewMemoryStore()
	} else {
		globalStore = NewPostgresStore(databaseURL)
	}
	if err := globalStore.Init(password); err != nil {
		return nil, err
	}
	return globalStore, nil
}

func GetStore() interfaces.StoreBase {
	return globalStore
}

func CloseStore() error {
	if globalStore != nil {
		err := globalStore.Close()
		globalStore = nil
		return err
	}
	return nil
}
