#!/bin/sh

#
# Generates a users home directory.
#
# Author: Michael Diponio
#


# Home directory skeleton directory
SKEL=/etc/skel

# Apache server group
chown -R $USER.apache $HOME

if [ ! $# -eq 2 ] ; then
	echo "Usage: $0 <user name> <directory path>"
	exit 1
fi

USER=$1
HOME=$2

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
mkdir  $HOME/.profile
mkdir 770 $HOME/Desktop
ln -sf 770 $HOME/Desktop $HOME/.profile/Desktop
ln -sf 770 $HOME "$HOME/.profile/My Documents"

# Change ownership of the home directory to the user
chown -R $USER.apache $HOME


