#!/bin/sh

# Home directory skeleton directory
SKEL=/etc/skel

if [ ! $# -eq 2 ] ; then
    echo "Usage: $0 <user name> <directory path>"
    exit 1
fi

USER=$1
HOME=$2

# Create the directory with user access mask
mkdir -p -m 0700 $HOME

# If skeleton home directory exists, populate it with skeleton files
if [ -d $SKEL ] ; then
    for FILE in `ls -a $SKEL` ; do
	case $FILE in
	    .)
		;;
	    ..)
		;;
	    *)
		cp -r $SKEL/$FILE $HOME
		;;
	esac
    done
fi

# Change ownership of the home directory to the user
chown -R $USER $HOME


