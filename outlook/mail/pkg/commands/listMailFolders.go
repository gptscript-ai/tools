package commands

import (
	"context"
	"fmt"
	"os"

	"github.com/gptscript-ai/go-gptscript"
	"github.com/gptscript-ai/tools/outlook/mail/pkg/client"
	"github.com/gptscript-ai/tools/outlook/mail/pkg/global"
	"github.com/gptscript-ai/tools/outlook/mail/pkg/graph"
	"github.com/gptscript-ai/tools/outlook/mail/pkg/printers"
	"github.com/gptscript-ai/tools/outlook/mail/pkg/util"
)

func ListMailFolders(ctx context.Context) error {
	c, err := client.NewClient(global.ReadOnlyScopes)
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}

	result, err := graph.ListMailFolders(ctx, c)
	if err != nil {
		return fmt.Errorf("failed to list mail folders: %w", err)
	}

	if len(result) > 10 {
		gptscriptClient, err := gptscript.NewGPTScript()
		if err != nil {
			return fmt.Errorf("failed to create GPTScript client: %w", err)
		}

		dataset, err := gptscriptClient.CreateDataset(ctx, os.Getenv("GPTSCRIPT_WORKSPACE_DIR"), "outlook_mail_folders", "Outlook mail folders")
		// If we got back an error, we just print the folders. Otherwise, write them to the dataset.
		if err == nil {
			for _, folder := range result {
				folderStr, err := printers.MailFolderToString(folder)
				if err != nil {
					return fmt.Errorf("failed to convert mail folder to string: %w", err)
				}

				if _, err = gptscriptClient.AddDatasetElement(ctx, os.Getenv("GPTSCRIPT_WORKSPACE_DIR"), dataset.ID, util.Deref(folder.GetId()), util.Deref(folder.GetDisplayName()), folderStr); err != nil {
					return fmt.Errorf("failed to add element: %w", err)
				}
			}

			fmt.Printf("Created dataset with ID %s with %d folders\n", dataset.ID, len(result))
			return nil
		}
	}

	return printers.PrintMailFolders(result)
}
