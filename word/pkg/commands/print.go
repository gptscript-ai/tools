package commands

import (
	"fmt"
)

type Info = fmt.Stringer

func printAll[T Info](infos []T) {
	for _, info := range infos {
		fmt.Println(info)
	}
}
