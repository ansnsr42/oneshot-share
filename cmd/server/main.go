package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	_ "github.com/mattn/go-sqlite3"
	"github.com/google/uuid"
)

var (
	dataDir = env("DATA_DIR", "./files")
	baseURL = env("BASE_URL", "http://localhost:8080")
	ttlHrs  = 24
	db      *sql.DB
)

func main() {
	if err := os.MkdirAll(dataDir, 0o750); err != nil {
		log.Fatal(err)
	}

	var err error
	db, err = sql.Open("sqlite3", filepath.Join(dataDir, "meta.db"))
	if err != nil {
		log.Fatal(err)
	}
	if err := migrate(); err != nil {
		log.Fatal(err)
	}

	r := chi.NewRouter()
	r.Post("/upload", handleUpload)
	r.Get("/d/{id}", handleDownload)

	port := env("PORT", "8080")
	log.Printf("listening on %s …", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func handleUpload(w http.ResponseWriter, r *http.Request) {
	id := uuid.NewString()
	path := filepath.Join(dataDir, id)

	// Datei speichern (GANZES Body => verschlüsselter Ciphertext)
	f, err := os.Create(path)
	if err != nil {
		http.Error(w, err.Error(), 500); return
	}
	defer f.Close()
	if _, err := io.Copy(f, r.Body); err != nil {
		http.Error(w, err.Error(), 500); return
	}

	exp := time.Now().Add(time.Duration(ttlHrs) * time.Hour).Unix()
	if _, err := db.Exec(`INSERT INTO meta(id,path,expires,used) VALUES(?,?,?,0)`, id, path, exp); err != nil {
		http.Error(w, err.Error(), 500); return
	}

	type resp struct{ Link string }
	out := resp{Link: fmt.Sprintf("%s/d/%s", baseURL, id)}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(out)
}

func handleDownload(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var path string
	var used, expires int64
	err := db.QueryRow(`SELECT path,used,expires FROM meta WHERE id=?`, id).
		Scan(&path, &used, &expires)
	if err == sql.ErrNoRows || used == 1 || expires < time.Now().Unix() {
		http.Error(w, "Gone", http.StatusGone); return
	} else if err != nil {
		http.Error(w, err.Error(), 500); return
	}

	http.ServeFile(w, r, path)

	// Flag as used + async delete
	go func() {
		db.Exec(`UPDATE meta SET used=1 WHERE id=?`, id)
		time.Sleep(5 * time.Second) // warten bis Transfer fertig
		os.Remove(path)
	}()
}

func migrate() error {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS meta(
		id TEXT PRIMARY KEY,
		path TEXT NOT NULL,
		expires INTEGER,
		used INTEGER
	)`)
	return err
}

func env(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

