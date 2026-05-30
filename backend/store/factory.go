package store

var globalStore StoreBase

func InitStore(useMemory bool, databaseURL string) (StoreBase, error) {
	if useMemory {
		globalStore = NewMemoryStore()
	} else {
		globalStore = NewPostgresStore(databaseURL)
	}
	if err := globalStore.Init(); err != nil {
		return nil, err
	}
	return globalStore, nil
}

func GetStore() StoreBase {
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
