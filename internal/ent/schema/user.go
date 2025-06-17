package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
)

// User holds the schema definition for the User entity.
type User struct {
	ent.Schema
}

func (User) Mixin() []ent.Mixin {
	return []ent.Mixin{
		BaseMixin{},
	}
}

// Fields of the User.
func (User) Fields() []ent.Field {
	return []ent.Field{
		field.String("name").NotEmpty().MinLen(2).MaxLen(60),
		field.String("email").NotEmpty().Unique(),
		field.String("password").Optional(),
		field.String("username").NotEmpty(),
		field.String("bio").Optional().MaxLen(255),
		field.String("avater_url").Optional(),
		field.String("cover_url").Optional(),
	}
}

// Edges of the User.
func (User) Edges() []ent.Edge {
	return nil
}
