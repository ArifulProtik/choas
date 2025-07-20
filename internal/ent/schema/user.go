package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
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
		field.String("password").Optional().Sensitive(),
		field.String("username").NotEmpty().Unique(),
		field.String("bio").Optional().MaxLen(255),
		field.String("avater_url").Optional(),
		field.String("cover_url").Optional(),
	}
}

// Edges of the User.
func (User) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("sessions", Session.Type),
		edge.To("owned_guilds", Guild.Type),
		edge.From("invitations", Invitation.Type).Ref("invited_by"),
		edge.To("member_of", Member.Type),
		// Friend relationships
		edge.From("friend_requests_sent", Friend.Type).Ref("requester"),
		edge.From("friend_requests_received", Friend.Type).Ref("addressee"),
		// Messaging relationships
		edge.From("sent_messages", Message.Type).Ref("sender"),
		edge.From("notifications", Notification.Type).Ref("user"),
		edge.From("related_notifications", Notification.Type).Ref("related_user"),
		edge.From("conversation_participations", ConversationParticipant.Type).Ref("user"),
		// Block relationships
		edge.From("blocked_users", Block.Type).Ref("blocker"),
		edge.From("blocked_by_users", Block.Type).Ref("blocked"),
	}
}
