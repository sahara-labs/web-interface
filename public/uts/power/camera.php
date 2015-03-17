<?php
$format = $_GET['format'];
$url = $_GET['url'];
?>
<!DOCTYPE html>
<html>
<head>
    <title>Power Lab Camera</title>
    <style type="text/css">
    body {
        margin: 0;
        padding: 0;
    }
    </style>
</head>
<body>
<?php if ($format == 'mjpeg'): ?>
    <?php if (strpos($_SERVER['HTTP_USER_AGENT'], 'MSIE') === FALSE): ?>
        <img style="width:640px;height:480px" src="<?=$url . '?' . date()?>" alt="&nbsp;" />
    <?php else: ?>
        <applet code="com.charliemouse.cambozola.Viewer" archive="/applets/cambozola.jar" 
                    'width="640" height="480">
            <param name="url" value="<?=$url?>" />
            <param name="accessories" value="none"/>
       </applet>
    <? endif; ?>
<?php elseif ($format == 'swf'): ?>
    <?php if (strpos($_SERVER['HTTP_USER_AGENT'], 'MSIE') === FALSE): ?>
        <object type="application/x-shockwave-flash" data="<?=$url?>" width="640" height="480">
                <param name="movie" value="<?=$url?>" />
                <param name="wmode" value="opaque" />
                <div class="no-flash-container">
                    <div class="no-flash-button">
                        <a href="http://www.adobe.com/go/getflash">
                            <img class="no-flash-image" src="/uts/coupledtanksnew/images/flash-icon.png"
                                alt="Get Adobe Flash player"/>
                            <span class="no-flash-button-text">Video requires Adobe Flash Player</span>
                        </a>
                    </div>
                    <p class="no-flash-substring">If you do not wish to install Adobe flash player 
                    you can try another video format using the drop down box below.</p>
                </div>
            </object>
    <?php else: ?>
        <object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"  width="640" height="480">
                <param name="movie" value="<?=$url?>" />
                <param name="wmode" value="opaque" />
                <div class="no-flash-container">
                    <div class="no-flash-button">
                        <a href="http://www.adobe.com/go/getflash">
                            <img class="no-flash-image" src="/uts/coupledtanksnew/images/flash-icon.png" alt="Get Adobe Flash player"/>
                            <span class="no-flash-button-text">Video requires Adobe Flash Player</span>
                        </a>
                    </div>
                    <p class="no-flash-substring">If you do not wish to install Adobe flash player 
                    you can try another video format using the drop down box below.</p>
                </div>
          </object>
    <?php endif; ?>
<?php elseif ($format == 'webm'): ?>
    <video src='<?=$url?>' width='640' height='480' "autoplay='true' >
    </video>
<?php else: ?>
    <h1>Missing format parameter.</h1>
<?php endif; ?> 
</body>
</html>