package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Member holds the schema definition for the Member entity.
type Member struct {
	ent.Schema
}

func (Member) Mixin() []ent.Mixin {
	return []ent.Mixin{
		BaseMixin{},
	}
}

// Fields of the Member.
func (Member) Fields() []ent.Field {
	return []ent.Field{
		field.String("nickname").Optional().MaxLen(255),
		field.Time("joined_at").Default(time.Now),
		field.Bool("is_muted").Default(false),
		field.Bool("is_deafened").Default(false),
		field.Bool("is_bannned").Default(false),
	}
}

// Edges of the Member.
func (Member) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("guild", Guild.Type).Ref("guild_members").Unique().Required(),
		edge.From("user", User.Type).Ref("member_of").Unique().Required(),
	}
}
