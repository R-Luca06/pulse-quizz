-- ═══════════════════════════════════════════════════════════════════════════════
-- Pulse Quizz — Réinitialisation des données de défi journalier
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Ce script supprime toutes les participations et séries existantes.
-- À exécuter dans Supabase Dashboard → SQL Editor → New query → Run
--
-- ATTENTION : opération irréversible.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Supprimer toutes les participations (scores, XP, etc.)
DELETE FROM daily_challenge_entries;

-- 2. Réinitialiser toutes les séries
DELETE FROM daily_streaks;
