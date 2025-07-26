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
		field.Enum("message_type").Values("text", "image", "file", "call_start", "call_end").Default("text"),
		field.Bool("is_deleted").Default(false),
		field.Time("edited_at").Optional(),
		field.String("call_id").Optional().Comment("Reference to call for call_start and call_end messages"),
	}
}

// Edges of the Message.
func (Message) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("conversation", Conversation.Type).Unique().Required().Field("conversation_id"),
		edge.To("sender", User.Type).Unique().Required().Field("sender_id"),
		edge.To("call", Call.Type).Unique().Field("call_id"),
	}
}

// Indexes of the Message.
func (Message) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("conversation_id", "created_at"),
		index.Fields("conversation_id", "is_deleted", "created_at"),
		index.Fields("sender_id"),
		index.Fields("sender_id", "created_at"),
		index.Fields("is_deleted"),
		index.Fields("message_type"),
		index.Fields("created_at"),
		index.Fields("call_id"),
	}
}
