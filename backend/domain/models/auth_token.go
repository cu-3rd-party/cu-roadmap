package models

import "github.com/google/uuid"

type AuthToken struct {
	// Token is a cookie string that gets assigned to a user
	Token uuid.UUID `gorm:"type:uuid;primaryKey"`
	// Ttl marks UNIX timestamp when the Token becomes invalid
	Ttl int64 `gorm:"type:bigint"`
}
