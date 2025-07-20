package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Notification holds the schema definition for the Notification entity.
type Notification struct {
	ent.Schema
}

func (Notification) Mixin() []ent.Mixin {
	return []ent.Mixin{
		BaseMixin{},
	}
}

// Fields of the Notification.
func (Notification) Fields() []ent.Field {
	return []ent.Field{
		field.String("user_id").NotEmpty(),
		field.Enum("type").Values("friend_request", "message", "friend_accepted"),
		field.String("title").NotEmpty().MaxLen(100),
		field.Text("content").NotEmpty(),
		field.Bool("is_read").Default(false),
		field.String("related_user_id").Optional(),
		field.String("related_conversation_id").Optional(),
	}
}

// Edges of the Notification.
func (Notification) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("user", User.Type).Unique().Required().Field("user_id"),
		edge.To("related_user", User.Type).Unique().Field("related_user_id"),
		edge.To("related_conversation", Conversation.Type).Unique().Field("related_conversation_id"),
	}
}

// Indexes of the Notification.
func (Notification) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("user_id", "created_at"),
		index.Fields("user_id", "is_read"),
		index.Fields("type"),
	}
}
