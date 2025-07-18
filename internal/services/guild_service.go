package services

import (
	"context"
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ent/guild"
	"kakashi/chaos/internal/ent/member"
	"kakashi/chaos/internal/ent/user"
)

func (s *Services) CreateGuild(ctx context.Context, name string, ownerid string) (*ent.Guild, error) {
	return s.ent.Guild.Create().
		SetName(name).
		SetOwnerID(ownerid).
		Save(ctx)
}

func (s *Services) FindGuildsByMemberUserID(ctx context.Context, userid string) ([]*ent.Guild, error) {
	return s.ent.Guild.Query().
		Where(guild.HasGuildMembersWith(member.HasUserWith(user.IDEQ(userid)))).
		All(ctx)
}

func (s *Services) AddGuildMember(ctx context.Context, guildid string, userid string) error {
	_, err := s.ent.Member.Create().SetGuildID(guildid).SetUserID(userid).Save(ctx)
	if err != nil {
		return err
	}
	return nil
}
