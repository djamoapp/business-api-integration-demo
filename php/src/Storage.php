<?php

declare(strict_types=1);

namespace Djamo\Example;

/**
 * Minimal JSON file storage used as a mock database — the PHP counterpart of
 * the Node backend's utils/fileStorage.js. Stores two collections, "orders"
 * and "transfers", in a single data/store.json file.
 *
 * Not concurrency-safe beyond a coarse file lock; it is meant for demos only.
 */
final class Storage
{
    private string $file;

    public function __construct(?string $file = null)
    {
        $this->file = $file ?? dirname(__DIR__) . '/data/store.json';
        $dir = dirname($this->file);
        if (!is_dir($dir)) {
            mkdir($dir, 0o755, true);
        }
        if (!is_file($this->file)) {
            $this->writeAll(['orders' => [], 'transfers' => []]);
        }
    }

    /** @return array{orders: array<int, array>, transfers: array<int, array>} */
    private function readAll(): array
    {
        $raw = file_get_contents($this->file);
        $data = $raw === false ? [] : json_decode($raw, true);
        if (!is_array($data)) {
            $data = [];
        }
        $data['orders'] ??= [];
        $data['transfers'] ??= [];
        return $data;
    }

    private function writeAll(array $data): void
    {
        file_put_contents(
            $this->file,
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            LOCK_EX
        );
    }

    /** Insert or replace a record (matched by "id") in the given collection. */
    public function save(string $collection, array $record): array
    {
        $data = $this->readAll();
        $items = $data[$collection] ?? [];
        $replaced = false;
        foreach ($items as $i => $item) {
            if (($item['id'] ?? null) === ($record['id'] ?? null)) {
                $items[$i] = $record;
                $replaced = true;
                break;
            }
        }
        if (!$replaced) {
            $items[] = $record;
        }
        $data[$collection] = $items;
        $this->writeAll($data);
        return $record;
    }

    /** Find the first record where $field === $value, or null. */
    public function findBy(string $collection, string $field, mixed $value): ?array
    {
        foreach ($this->readAll()[$collection] ?? [] as $item) {
            if (($item[$field] ?? null) === $value) {
                return $item;
            }
        }
        return null;
    }
}
