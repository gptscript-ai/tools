package commands

import (
	"context"
	"fmt"

	"github.com/gptscript-ai/tools/outlook/calendar/pkg/client"
	"github.com/gptscript-ai/tools/outlook/calendar/pkg/global"
	"github.com/gptscript-ai/tools/outlook/calendar/pkg/graph"
)

func RespondToEvent(ctx context.Context, eventID, calendarID string, owner graph.OwnerType, response string) error {
	c, err := client.NewClient(global.AllScopes)
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}

	switch response {
	case "accept":
		if err := graph.AcceptEvent(ctx, c, eventID, calendarID, owner); err != nil {
			return fmt.Errorf("failed to accept event: %w", err)
		}
		fmt.Println("Event accepted successfully")
	case "tentative":
		if err := graph.TentativelyAcceptEvent(ctx, c, eventID, calendarID, owner); err != nil {
			return fmt.Errorf("failed to tentatively accept event: %w", err)
		}
		fmt.Println("Event tentatively accepted successfully")
	case "decline":
		if err := graph.DeclineEvent(ctx, c, eventID, calendarID, owner); err != nil {
			return fmt.Errorf("failed to decline event: %w", err)
		}
		fmt.Println("Event declined successfully")
	default:
		return fmt.Errorf("invalid response: %s", response)
	}

	return nil
}
