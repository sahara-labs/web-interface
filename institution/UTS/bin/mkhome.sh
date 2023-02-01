#!/bin/sh

#
# Generates a users home directory.
#
# Author: Michael Diponio
# Author: Tania Machet
#


# Home directory skeleton directory
SKEL=/etc/skel
LOG=/var/log/messages

if [ ! $# -eq 2 ] ; then
	echo "Usage: $0 <user name> <directory path>"
	exit 1
fi

USER=$1
HOME=$2

if [ -d $HOME ] ; then
    echo "No need to create home directory $HOME, it already exists." >> $LOG
    exit 0
fi 

echo "Creating home directory $HOME for user $USER." >> $LOG

# Create the directory with user access mask
mkdir -p -m 0770 $HOME

# If skeleton home directory exists, populate it with skeleton files
if [ -d $SKEL ] ; then
	for FILE in `ls -a $SKEL` ; do
	case $FILE in
		.)
			# Don't copy the directory itself
			;;
		..)
			# Don't copy the parent directory
			;;
		*)
			# Copy everything else
			cp -r $SKEL/$FILE $HOME
		;;
	esac
	done
fi

# Create the Windows roaming profile directory
mkdir -m 770 $HOME/.profile
mkdir -m 770 "$HOME/.profile/My Documents"
mkdir -m 770 $HOME/.profile/Desktop
mkdir -m 770 $HOME/Desktop

# Change ownership of the home directory to the user
chown -R $USER:apache $HOME


