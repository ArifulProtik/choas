package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Block holds the schema definition for the Block entity.
type Block struct {
	ent.Schema
}

func (Block) Mixin() []ent.Mixin {
	return []ent.Mixin{
		BaseMixin{},
	}
}

// Fields of the Block.
func (Block) Fields() []ent.Field {
	return []ent.Field{
		field.String("blocker_id").NotEmpty(),
		field.String("blocked_id").NotEmpty(),
	}
}

// Edges of the Block.
func (Block) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("blocker", User.Type).Unique().Required().Field("blocker_id"),
		edge.To("blocked", User.Type).Unique().Required().Field("blocked_id"),
	}
}

// Indexes of the Block.
func (Block) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("blocker_id", "blocked_id").Unique(),
		index.Fields("blocked_id"),
	}
}
