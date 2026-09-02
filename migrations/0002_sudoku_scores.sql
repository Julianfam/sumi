create table if not exists sudoku_scores (
  id          serial primary key,
  nickname    text not null,
  difficulty  text not null,
  time_ms     integer not null,
  created_at  timestamptz not null default now()
);

create index if not exists sudoku_scores_diff_time_idx
  on sudoku_scores (difficulty, time_ms, created_at);
