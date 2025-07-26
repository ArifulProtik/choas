package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Call holds the schema definition for the Call entity.
type Call struct {
	ent.Schema
}

func (Call) Mixin() []ent.Mixin {
	return []ent.Mixin{
		BaseMixin{},
	}
}

// Fields of the Call.
func (Call) Fields() []ent.Field {
	return []ent.Field{
		field.String("caller_id").NotEmpty(),
		field.String("callee_id").NotEmpty(),
		field.Enum("call_type").Values("voice", "video").Default("voice"),
		field.Enum("status").Values("pending", "ringing", "accepted", "declined", "ended", "missed", "failed").Default("pending"),
		field.Time("started_at").Optional(),
		field.Time("answered_at").Optional(),
		field.Time("ended_at").Optional(),
		field.Int("duration").Optional().Comment("Duration in seconds"),
	}
}

// Edges of the Call.
func (Call) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("caller", User.Type).Unique().Required().Field("caller_id"),
		edge.To("callee", User.Type).Unique().Required().Field("callee_id"),
	}
}

// Indexes of the Call.
func (Call) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("caller_id", "created_at"),
		index.Fields("callee_id", "created_at"),
		index.Fields("status"),
		index.Fields("call_type"),
		index.Fields("created_at"),
		index.Fields("caller_id", "status"),
		index.Fields("callee_id", "status"),
	}
}
