"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAsyncOperation } from "../../hooks/useAsyncOperation";
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Zap,
} from "lucide-react";

interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
    heap: {
      total: number;
      used: number;
      external: number;
    };
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
  };
}

interface ApplicationMetrics {
  timestamp: number;
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
    requestsPerSecond: number;
  };
  database: {
    connections: number;
    queries: number;
    averageQueryTime: number;
    slowQueries: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };
  errors: {
    total: number;
    rate: number;
    types: Record<string, number>;
  };
}

interface PerformanceAlert {
  id: string;
  type: "cpu" | "memory" | "disk" | "response_time" | "error_rate";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
}

interface MonitoringData {
  system: SystemMetrics;
  application: ApplicationMetrics;
  alerts: PerformanceAlert[];
  timestamp: number;
}

const MonitoringDashboard = React.memo(function MonitoringDashboard() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(
    null
  );
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // 30초

  const {
    loading,
    error,
    execute: fetchMonitoringData,
  } = useAsyncOperation<MonitoringData>();

  // 모니터링 데이터 가져오기
  const loadMonitoringData = async () => {
    try {
      const response = await fetch("/api/monitoring/status");
      const data = await response.json();
      return data.metrics;
    } catch (error) {
      throw new Error("모니터링 데이터를 가져올 수 없습니다.");
    }
  };

  // 초기 데이터 로드 및 자동 새로고침
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchMonitoringData(loadMonitoringData);
      if (data) {
        setMonitoringData(data);
      }
    };

    loadData();

    if (autoRefresh) {
      const interval = setInterval(loadData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchMonitoringData]);

  // 수동 새로고침
  const handleRefresh = useCallback(async () => {
    const data = await fetchMonitoringData(loadMonitoringData);
    if (data) {
      setMonitoringData(data);
    }
  }, [fetchMonitoringData]);

  // 바이트를 읽기 쉬운 형태로 변환
  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // 시간 포맷팅
  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  }, []);

  // 상태 색상 결정
  const getStatusColor = useCallback(
    (value: number, thresholds: { warning: number; critical: number }) => {
      if (value >= thresholds.critical) return "text-red-500";
      if (value >= thresholds.warning) return "text-yellow-500";
      return "text-green-500";
    },
    []
  );

  // 알림 아이콘
  const getAlertIcon = useCallback((severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "medium":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-blue-500" />;
    }
  }, []);

  if (loading && !monitoringData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">모니터링 데이터 로딩 중...</span>
      </div>
    );
  }

  if (error && !monitoringData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!monitoringData) {
    return (
      <div className="text-center py-8 text-gray-500">
        모니터링 데이터가 없습니다.
      </div>
    );
  }

  const { system, application, alerts } = monitoringData;

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시스템 모니터링</h1>
          <p className="text-gray-600">
            마지막 업데이트: {formatTime(monitoringData.timestamp)}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">자동 새로고침</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              disabled={!autoRefresh}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={10}>10초</option>
              <option value={30}>30초</option>
              <option value={60}>1분</option>
              <option value={300}>5분</option>
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* 알림 */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            활성 알림 ({alerts.length}개)
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center gap-2 text-sm">
                {getAlertIcon(alert.severity)}
                <span className="flex-1">{alert.message}</span>
                <span className="text-gray-500">
                  {formatTime(alert.timestamp)}
                </span>
              </div>
            ))}
            {alerts.length > 5 && (
              <p className="text-sm text-gray-600">
                그 외 {alerts.length - 5}개의 알림이 더 있습니다.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 시스템 메트릭 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">CPU</h3>
            </div>
            <span
              className={`text-2xl font-bold ${getStatusColor(
                system.cpu.usage,
                { warning: 70, critical: 85 }
              )}`}
            >
              {system.cpu.usage}%
            </span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div>코어: {system.cpu.cores}개</div>
            <div>로드 평균: {system.cpu.loadAverage[0].toFixed(2)}</div>
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                system.cpu.usage >= 85
                  ? "bg-red-500"
                  : system.cpu.usage >= 70
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${system.cpu.usage}%` }}
            />
          </div>
        </div>

        {/* 메모리 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold">메모리</h3>
            </div>
            <span
              className={`text-2xl font-bold ${getStatusColor(
                system.memory.usage,
                { warning: 80, critical: 90 }
              )}`}
            >
              {system.memory.usage.toFixed(1)}%
            </span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div>사용: {formatBytes(system.memory.used)}</div>
            <div>전체: {formatBytes(system.memory.total)}</div>
            <div>힙: {formatBytes(system.memory.heap.used)}</div>
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                system.memory.usage >= 90
                  ? "bg-red-500"
                  : system.memory.usage >= 80
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${system.memory.usage}%` }}
            />
          </div>
        </div>

        {/* 디스크 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">디스크</h3>
            </div>
            <span
              className={`text-2xl font-bold ${getStatusColor(
                system.disk.usage,
                { warning: 80, critical: 90 }
              )}`}
            >
              {system.disk.usage}%
            </span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div>사용: {formatBytes(system.disk.used)}</div>
            <div>전체: {formatBytes(system.disk.total)}</div>
            <div>여유: {formatBytes(system.disk.free)}</div>
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                system.disk.usage >= 90
                  ? "bg-red-500"
                  : system.disk.usage >= 80
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${system.disk.usage}%` }}
            />
          </div>
        </div>

        {/* 네트워크 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold">네트워크</h3>
            </div>
            <Activity className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div>수신: {formatBytes(system.network.bytesReceived)}</div>
            <div>송신: {formatBytes(system.network.bytesSent)}</div>
          </div>
        </div>
      </div>

      {/* 애플리케이션 메트릭 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 요청 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">요청</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">총 요청</span>
              <span className="font-semibold">
                {application.requests.total}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">성공률</span>
              <span className="font-semibold text-green-600">
                {application.requests.total > 0
                  ? (
                      (application.requests.successful /
                        application.requests.total) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">평균 응답시간</span>
              <span
                className={`font-semibold ${
                  application.requests.averageResponseTime > 1000
                    ? "text-red-500"
                    : application.requests.averageResponseTime > 500
                    ? "text-yellow-500"
                    : "text-green-500"
                }`}
              >
                {application.requests.averageResponseTime.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">RPS</span>
              <span className="font-semibold">
                {application.requests.requestsPerSecond.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* 데이터베이스 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">데이터베이스</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">연결 수</span>
              <span className="font-semibold">
                {application.database.connections}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">쿼리 수</span>
              <span className="font-semibold">
                {application.database.queries}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">평균 쿼리시간</span>
              <span
                className={`font-semibold ${
                  application.database.averageQueryTime > 1000
                    ? "text-red-500"
                    : application.database.averageQueryTime > 500
                    ? "text-yellow-500"
                    : "text-green-500"
                }`}
              >
                {application.database.averageQueryTime.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">느린 쿼리</span>
              <span
                className={`font-semibold ${
                  application.database.slowQueries > 0
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                {application.database.slowQueries}
              </span>
            </div>
          </div>
        </div>

        {/* 캐시 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold">캐시</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">히트율</span>
              <span
                className={`font-semibold ${
                  application.cache.hitRate >= 80
                    ? "text-green-500"
                    : application.cache.hitRate >= 60
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                {application.cache.hitRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">히트</span>
              <span className="font-semibold text-green-600">
                {application.cache.hits}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">미스</span>
              <span className="font-semibold text-red-600">
                {application.cache.misses}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">크기</span>
              <span className="font-semibold">
                {formatBytes(application.cache.size)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 에러 통계 */}
      {application.errors.total > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            에러 통계
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-red-500">
                {application.errors.total}
              </div>
              <div className="text-sm text-gray-600">총 에러</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">
                {application.errors.rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">에러율</div>
            </div>
            {Object.entries(application.errors.types).map(([type, count]) => (
              <div key={type}>
                <div className="text-lg font-semibold">{count}</div>
                <div className="text-sm text-gray-600">{type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default MonitoringDashboard;
