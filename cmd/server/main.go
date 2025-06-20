package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

var (
	dataDir = env("DATA_DIR", "./files")
	db      *sql.DB
)

func main() {
	os.MkdirAll(dataDir, 0o750)

	var err error
	db, err = sql.Open("sqlite3", filepath.Join(dataDir, "meta.db"))
	if err != nil { log.Fatal(err) }
	migrate()

	r := chi.NewRouter()
	r.Use(cors)

	r.Post("/upload", handleUpload)
	r.Get("/d/{id}", handleDownload)

	log.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

// ---------- UPLOAD ----------
func handleUpload(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" { http.Error(w, "missing name", 400); return }
	name, _ = url.QueryUnescape(name)

	id, path := uuid.NewString(), filepath.Join(dataDir, uuid.NewString())
	f, err := os.Create(path)
	if err != nil { http.Error(w, err.Error(), 500); return }
	defer f.Close()
	if _, err := io.Copy(f, r.Body); err != nil {
		http.Error(w, err.Error(), 500); return
	}

	if _, err := db.Exec(
		`INSERT INTO meta(id,path,name,used) VALUES(?,?,?,0)`,
		id, path, name); err != nil {
		http.Error(w, err.Error(), 500); return
	}

	type resp struct{ Link string `json:"link"` }
	json.NewEncoder(w).Encode(resp{Link: "/d/" + id})
}

// ---------- DOWNLOAD ----------
func handleDownload(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var path, name string
	var used int
	err := db.QueryRow(`SELECT path,name,used FROM meta WHERE id=?`, id).
		Scan(&path, &name, &used)
	if err == sql.ErrNoRows || used == 1 {
		http.Error(w, "Gone", 410); return
	} else if err != nil {
		http.Error(w, err.Error(), 500); return
	}

	w.Header().Set("Content-Disposition",
		fmt.Sprintf(`attachment; filename="%s"`, url.PathEscape(name)))
	http.ServeFile(w, r, path)

	go func() {                     // nach Auslieferung: markieren + löschen
		db.Exec(`UPDATE meta SET used=1 WHERE id=?`, id)
		time.Sleep(5 * time.Second)
		os.Remove(path)
	}()
}

// ---------- Helpers ----------
func migrate() {
	db.Exec(`CREATE TABLE IF NOT EXISTS meta(
		id TEXT PRIMARY KEY,
		path TEXT NOT NULL,
		name TEXT NOT NULL,
		used INTEGER
	)`)
}

func env(k, d string) string {
	if v := os.Getenv(k); v != "" { return v }
	return d
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		if r.Method == http.MethodOptions { w.WriteHeader(204); return }
		next.ServeHTTP(w, r)
	})
}

