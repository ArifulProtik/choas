package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Conversation holds the schema definition for the Conversation entity.
type Conversation struct {
	ent.Schema
}

func (Conversation) Mixin() []ent.Mixin {
	return []ent.Mixin{
		BaseMixin{},
	}
}

// Fields of the Conversation.
func (Conversation) Fields() []ent.Field {
	return []ent.Field{
		field.Enum("type").Values("direct", "group").Default("direct"),
		field.String("name").Optional().MaxLen(100),
		field.Time("last_message_at").Optional(),
		field.Bool("is_archived").Default(false),
		field.Bool("is_muted").Default(false),
	}
}

// Edges of the Conversation.
func (Conversation) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("messages", Message.Type),
		edge.To("participants", ConversationParticipant.Type),
	}
}

// Indexes of the Conversation.
func (Conversation) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("type"),
		index.Fields("last_message_at"),
		index.Fields("is_archived"),
	}
}
