package store

import (
	"regexp"
	"strconv"
	"strings"
)

var majorCohortSuffixRE = regexp.MustCompile(`^(.*?)\s*\((\d{4})\)\s*$`)

func splitMajorTitleAndCohort(title string) (string, int) {
	title = strings.TrimSpace(title)
	match := majorCohortSuffixRE.FindStringSubmatch(title)
	if len(match) != 3 {
		return title, 0
	}

	cohortYear, err := strconv.Atoi(match[2])
	if err != nil {
		return title, 0
	}

	cleanTitle := strings.TrimSpace(match[1])
	if cleanTitle == "" {
		return title, 0
	}

	return cleanTitle, cohortYear
}
