package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Message holds the schema definition for the Message entity.
type Message struct {
	ent.Schema
}

func (Message) Mixin() []ent.Mixin {
	return []ent.Mixin{
		BaseMixin{},
	}
}

// Fields of the Message.
func (Message) Fields() []ent.Field {
	return []ent.Field{
		field.String("conversation_id").NotEmpty(),
		field.String("sender_id").NotEmpty(),
		field.Text("content").NotEmpty(),
		field.Enum("message_type").Values("text", "image", "file").Default("text"),
		field.Bool("is_deleted").Default(false),
		field.Time("edited_at").Optional(),
	}
}

// Edges of the Message.
func (Message) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("conversation", Conversation.Type).Unique().Required().Field("conversation_id"),
		edge.To("sender", User.Type).Unique().Required().Field("sender_id"),
	}
}

// Indexes of the Message.
func (Message) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("conversation_id", "created_at"),
		index.Fields("sender_id"),
		index.Fields("is_deleted"),
	}
}
