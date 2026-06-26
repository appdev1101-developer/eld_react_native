package com.truxy

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * SQLite store for GeoData records that could not be uploaded (offline queue).
 */
class GeoDataDatabase(context: Context) :
    SQLiteOpenHelper(context, "geodata_queue.db", null, 1) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            "CREATE TABLE IF NOT EXISTS pending_uploads (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "payload TEXT NOT NULL, " +
                "created_at INTEGER NOT NULL)"
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS pending_uploads")
        onCreate(db)
    }

    fun insert(payload: String) {
        val cv = ContentValues().apply {
            put("payload", payload)
            put("created_at", System.currentTimeMillis())
        }
        writableDatabase.insert("pending_uploads", null, cv)
    }

    /** Returns list of (rowId, jsonPayload) ordered oldest-first. */
    fun getAll(): List<Pair<Long, String>> {
        val result = mutableListOf<Pair<Long, String>>()
        val cursor = readableDatabase.rawQuery(
            "SELECT id, payload FROM pending_uploads ORDER BY created_at ASC", null
        )
        cursor.use {
            while (it.moveToNext()) {
                result.add(Pair(it.getLong(0), it.getString(1)))
            }
        }
        return result
    }

    fun delete(id: Long) {
        writableDatabase.delete("pending_uploads", "id=?", arrayOf(id.toString()))
    }

    fun count(): Int {
        readableDatabase.rawQuery("SELECT COUNT(*) FROM pending_uploads", null).use {
            return if (it.moveToFirst()) it.getInt(0) else 0
        }
    }
}
