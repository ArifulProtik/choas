package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Guild holds the schema definition for the Guild entity.
type Guild struct {
	ent.Schema
}

func (Guild) Mixin() []ent.Mixin {
	return []ent.Mixin{
		BaseMixin{},
	}
}

// Fields of the Guild.
func (Guild) Fields() []ent.Field {
	return []ent.Field{
		field.String("name").NotEmpty(),
		field.String("guild_icon").Optional(),
		field.String("description").Optional(),
		field.String("guild_cover").Optional(),
	}
}

// Edges of the Guild.
func (Guild) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("owner", User.Type).Ref("owned_guilds").Unique().Required(),
		edge.From("invitations", Invitation.Type).Ref("guild"),
		edge.To("guild_members", Member.Type),
	}
}
