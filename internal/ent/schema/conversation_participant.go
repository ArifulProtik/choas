package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// ConversationParticipant holds the schema definition for the ConversationParticipant entity.
type ConversationParticipant struct {
	ent.Schema
}

func (ConversationParticipant) Mixin() []ent.Mixin {
	return []ent.Mixin{
		BaseMixin{},
	}
}

// Fields of the ConversationParticipant.
func (ConversationParticipant) Fields() []ent.Field {
	return []ent.Field{
		field.String("conversation_id").NotEmpty(),
		field.String("user_id").NotEmpty(),
		field.Time("joined_at").Default(time.Now),
		field.Time("last_read_at").Optional(),
	}
}

// Edges of the ConversationParticipant.
func (ConversationParticipant) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("conversation", Conversation.Type).Unique().Required().Field("conversation_id"),
		edge.To("user", User.Type).Unique().Required().Field("user_id"),
	}
}

// Indexes of the ConversationParticipant.
func (ConversationParticipant) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("conversation_id", "user_id").Unique(),
		index.Fields("user_id"),
		index.Fields("last_read_at"),
	}
}
