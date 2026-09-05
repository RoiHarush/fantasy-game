package com.fantasy.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.lang.management.BufferPoolMXBean;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryUsage;

@Component
@ConditionalOnProperty(name = "app.memory.monitor-enabled", havingValue = "true")
public class MemoryPressureMonitor {

    private static final Logger log = LoggerFactory.getLogger(MemoryPressureMonitor.class);

    @Scheduled(fixedDelayString = "${app.memory.log-interval:5m}")
    public void logMemoryPressure() {
        MemoryUsage heap = ManagementFactory.getMemoryMXBean().getHeapMemoryUsage();
        MemoryUsage nonHeap = ManagementFactory.getMemoryMXBean().getNonHeapMemoryUsage();
        long directBytes = bufferPoolBytes("direct");
        long mappedBytes = bufferPoolBytes("mapped");

        log.info(
                "JVM memory snapshot: heapUsedMb={}, heapCommittedMb={}, heapMaxMb={}, nonHeapUsedMb={}, directBufferMb={}, mappedBufferMb={}, liveThreads={}, loadedClasses={}",
                toMiB(heap.getUsed()),
                toMiB(heap.getCommitted()),
                toMiB(heap.getMax()),
                toMiB(nonHeap.getUsed()),
                toMiB(directBytes),
                toMiB(mappedBytes),
                ManagementFactory.getThreadMXBean().getThreadCount(),
                ManagementFactory.getClassLoadingMXBean().getLoadedClassCount()
        );
    }

    private long bufferPoolBytes(String name) {
        return ManagementFactory.getPlatformMXBeans(BufferPoolMXBean.class).stream()
                .filter(pool -> name.equals(pool.getName()))
                .mapToLong(BufferPoolMXBean::getMemoryUsed)
                .sum();
    }

    private long toMiB(long bytes) {
        return bytes < 0 ? -1 : bytes / (1024L * 1024L);
    }
}
