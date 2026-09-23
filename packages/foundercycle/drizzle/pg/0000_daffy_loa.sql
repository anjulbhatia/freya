CREATE TABLE "agent_config" (
	"id" integer PRIMARY KEY NOT NULL,
	"model" text DEFAULT 'auto' NOT NULL,
	"approval_mode" text DEFAULT 'manual' NOT NULL,
	"review_threshold" real DEFAULT 0.5 NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cards_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"type" text DEFAULT 'task' NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"links_json" text DEFAULT '[]' NOT NULL,
	"approval_flag" integer DEFAULT 0 NOT NULL,
	"project_id" integer DEFAULT 1 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "connections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"provider" text NOT NULL,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"scopes" text DEFAULT '' NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "connections_provider_unique" UNIQUE("provider")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"context" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "projects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"archived" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"card_id" integer,
	"steps_json" text DEFAULT '[]' NOT NULL,
	"result" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;