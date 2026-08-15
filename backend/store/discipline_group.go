package store

import (
	"errors"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/helpers"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (s *PostgresStore) CreateDisciplineGroup(group interfaces.DisciplineGroupData) (interfaces.DisciplineGroupData, error) {
	model := helpers.ToDisciplineGroupModel(group)
	if err := s.db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "id"}}, UpdateAll: true}).Create(&model).Error; err != nil {
		return group, err
	}
	return group, nil
}

func (s *PostgresStore) UpdateDisciplineGroup(group interfaces.DisciplineGroupData) (interfaces.DisciplineGroupData, error) {
	model := helpers.ToDisciplineGroupModel(group)
	if err := s.db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "id"}}, UpdateAll: true}).Create(&model).Error; err != nil {
		return group, err
	}
	return group, nil
}

func (s *PostgresStore) GetDisciplineGroupByID(id uuid.UUID) (*interfaces.DisciplineGroupData, error) {
	var m models.DisciplineGroup
	if err := s.db.First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	data := helpers.ToDisciplineGroupData(&m)
	return &data, nil
}

func (s *PostgresStore) GetAllDisciplineGroups() ([]interfaces.DisciplineGroupData, error) {
	var m []models.DisciplineGroup
	if err := s.db.Find(&m).Error; err != nil {
		return nil, err
	}
	out := make([]interfaces.DisciplineGroupData, len(m))
	for i, v := range m {
		out[i] = helpers.ToDisciplineGroupData(&v)
	}
	return out, nil
}

func (s *PostgresStore) DeleteDisciplineGroup(id uuid.UUID) error {
	return s.db.Delete(&models.DisciplineGroup{}, "id = ?", id).Error
}
