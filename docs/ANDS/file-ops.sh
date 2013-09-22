#!/bin/bash

#
# This script moves or deletes files to a directory as a specified user. 
# 
# The Web Interface suses this script to modify the data store mount with 
# the credentials of a user that has permission to write in the data store.
# To do this, sudo must be configured by adding the following line to 
# /var/log/sudoers:
#
#     <web server user> ALL = (<mount user>) NOPASSWD:<path to script>/file-ops.sh

#
# Author: Michael Diponio
#

#
# The source directory where files are moved from or deleted from.
#
SRC_DIR=""

#
# The destination directory where files are moved to or deleted from.
#
DEST_DIR=""

#
# The user the operations are run as.
#
RUN_USER=""

# 
# Ensures a file is a directory as a beginning of its path.
#
# Argument: directory to test
# Argument: whether to
# Return: 0 if in directory, 1 if not
function in_dir 
{
    if [[ $1 == $2* ]] ; then
        return 0
    else
        return 1
    fi
}

# Make sure directories exist.
if [[ ! -d $SRC_DIR ]] ; then
    echo "Source directory does not exist."
    exit 1
fi

if [[ ! -d $DEST_DIR ]] ; then
    echo "Destination directory does not exist."
    exit 1
fi

# Make sure the user exists. 
if [[ $RUN_USER == "" ]] ; then
    echo "Run user for script $0 must be configured."
    exit 1
fi

# Make sure we are the correct user
if [[ ! `whoami` == $RUN_USER ]] ; then
    echo "The current user is not '$RUN_USER'."
    exit 1
fi

# Check the command line arguments
if [[ $# -lt 2 || $# -gt 3 ]] ; then
    echo "Usage $0 cp|del <file1> [file2]"
    exit 2
fi

case "$1" in

cp) # Copying a file from the source directory to the destination directory
    
    in_dir $2 $SRC_DIR
    if [[ ! $? == 0 ]] ; then
        echo "$2 not in $SRC_DIR."
        exit 2
    fi 
    
    in_dir $3 $DEST_DIR
    if [[ ! $? == 0 ]] ; then
        echo "$3 not in $DEST_DIR."
        exit 2
    fi
    
    # Make sure the source file exists
    if [[ ! -f $2 ]] ; then
        echo "File $2 does not exist."
        exit 2
    fi
    
    # Make sure the directory the file is in exists
    DIR=`dirname $3`
    if [[ ! -d $DIR ]] ; then
        mkdir -p $DIR &> /dev/null
        if [[ ! $? == 0 ]] ; then
            echo "Failed to create directory $DIR."
            exit 3
        fi
    fi
    
    cp $2 $3 &> /dev/null
    if [[ ! $? == 0 ]] ; then
        echo "Failed to move file $2 to $3."
        exit 3
    fi
    ;;
    
del) # Deleting a file in the destination directory
    in_dir $2 $DEST_DIR
    if [[ ! $? == 0 ]] ; then
        echo "$2 not in $DEST_DIR."
        exit 2
    fi
    
    rm -f $2 &> /dev/null
    if [[ ! $? == 0 ]] ; then
        echo "Failed to delete file $2."
        exit 3
    fi
    ;;
    
*)
    echo "Unknown command $1.";
    exit 2;
    ;;
esac

# Successfuly operation
exit 0