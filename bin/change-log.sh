#!/bin/bash

# Check if exactly two arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <start_hash> <end_hash>"
    exit 1
fi

start_hash=$1
end_hash=$2

section_dependabot=""
section_fix=""
section_added=""
section_removed=""
section_other=""

while IFS= read -r line; do
    # Extract the author name from the line (text between "(" and the first ",")
    author=$(echo "$line" | cut -d '(' -f2 | cut -d ',' -f1)

    # Check if the author is dependabot[bot]
    if [[ "$author" == "dependabot[bot]" ]]; then
        section_dependabot+="$line\n"
        continue
    fi

    # Extract the commit message
    message=$(echo "$line" | cut -d ' ' -f1- | cut -d '(' -f1)
    message=$(echo "$message" | tr '[:upper:]' '[:lower:]')

    # Determine the section based on the commit message
    case "$message" in
        fix*|refactor*|improve*)
            section_fix+="$line\n"
            ;;
        add*)
            section_added+="$line\n"
            ;;
        remove*|deprecate*)
            section_removed+="$line\n"
            ;;
        *)
            section_other+="$line\n"
            ;;
    esac
done < <(git log "$start_hash".."$end_hash" --no-merges --format="%s (%an, %ad, %h)" --date=format:'%d/%m/%y %H:%M:%S')

# Print the sections
echo "## $start_hash..$end_hash - $(date +'%d/%m/%y %H:%M:%S')"

print_section() {
    local title="$1"
    local content="$2"
    if [ -n "$content" ]; then
        echo -e "\n### $title:"
        echo -e ""
        echo -e "$content" | sed '/^$/d; s/^/ - /'
    fi
}

print_section "Added" "$section_added"
print_section "Fixed" "$section_fix"
print_section "Removed" "$section_removed"
print_section "Other" "$section_other"
print_section "Dependabot" "$section_dependabot"

# Add a newline at the end for better readability
echo
