package metrics

import (
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
)

var (
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cu_roadmap_http_requests_total",
			Help: "Total number of HTTP requests.",
		},
		[]string{"method", "path", "status"},
	)

	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "cu_roadmap_http_request_duration_seconds",
			Help:    "HTTP request duration in seconds.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path", "status"},
	)

	dbQueriesTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cu_roadmap_db_queries_total",
			Help: "Total number of database queries executed.",
		},
		[]string{"operation"},
	)

	cacheRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cu_roadmap_cache_requests_total",
			Help: "Total number of cache lookups partitioned by result.",
		},
		[]string{"store", "result"},
	)
)

func init() {
	prometheus.MustRegister(httpRequestsTotal, httpRequestDuration, dbQueriesTotal, cacheRequestsTotal)
}

func ObserveHTTPRequest(method, path string, statusCode int, duration time.Duration) {
	status := strconv.Itoa(statusCode)
	httpRequestsTotal.WithLabelValues(method, path, status).Inc()
	httpRequestDuration.WithLabelValues(method, path, status).Observe(duration.Seconds())
}

func ObserveDBQuery(operation string) {
	dbQueriesTotal.WithLabelValues(operation).Inc()
}

func ObserveCacheResult(storeName string, hit bool) {
	result := "miss"
	if hit {
		result = "hit"
	}
	cacheRequestsTotal.WithLabelValues(storeName, result).Inc()
}
