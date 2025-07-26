package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Friend holds the schema definition for the Friend entity.
type Friend struct {
	ent.Schema
}

func (Friend) Mixin() []ent.Mixin {
	return []ent.Mixin{
		BaseMixin{},
	}
}

// Fields of the Friend.
func (Friend) Fields() []ent.Field {
	return []ent.Field{
		field.String("requester_id").NotEmpty(),
		field.String("addressee_id").NotEmpty(),
		field.Enum("status").Values("pending", "accepted", "declined").Default("pending"),
	}
}

// Edges of the Friend.
func (Friend) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("requester", User.Type).Unique().Required().Field("requester_id"),
		edge.To("addressee", User.Type).Unique().Required().Field("addressee_id"),
	}
}

// Indexes of the Friend.
func (Friend) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("requester_id", "addressee_id").Unique(),
		index.Fields("addressee_id", "status"),
		index.Fields("requester_id", "status"),
		index.Fields("status"),
		index.Fields("created_at"),
		index.Fields("addressee_id", "status", "created_at"),
		index.Fields("requester_id", "status", "created_at"),
	}
}
