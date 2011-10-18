<?php

$config = array(

        'sets' => array(


                'aaf-metadata' => array(
                        'cron'          => array('hourly'),
                        'sources'       => array(
                                array(
                                        'src' => 'https://manager.aaf.edu.au/metadata/metadata.aaf.signed.complete.xml',
                                        'validateFingerprint' => '85:99:A5:A3:97:30:97:99:96:54:9E:2C:3B:D1:58:79:58:3F:5F:1F',
                                ),
                        ),
                        'expireAfter'           => 60*60*24*4, // Maximum 4 days cache time.
                        'outputDir'     => 'metadata/metadata-aaf-consuming/',

                        /*
                         * Which output format the metadata should be saved as.
                         * Can be 'flatfile' or 'serialize'. 'flatfile' is the default.
                         */
                        'outputFormat' => 'flatfile',
                ),


        ),
);

