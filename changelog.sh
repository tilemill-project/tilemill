## This script is run by npm prior to publishing.


echo "<!DOCTYPE html>
<html>
<head>
  <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
  <title>TileMill | Upgrade notes</title>
  <script type='text/javascript' src='jquery.js'></script>
  <script type='text/javascript' src='showdown.js'></script>
  <link rel='shortcut icon' href='images/favicon.ico' type='image/x-icon' />
  <link rel='stylesheet' media='all' href='reset.css' />
  <link rel='stylesheet' media='all' href='style.css' />
  <script type='text/javascript'>

    var _gaq = _gaq || [];
    _gaq.push(['_setAccount', 'UA-88478-19']);
    _gaq.push(['_trackPageview']);

    (function() {
      var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
      ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
      var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    })();

  </script>
  <script type='text/javascript' src='script.js'></script>
</head>
<body>
<div class='header limiter'>
  <a href='index.html' class='logo'>TileMill</a>
  <ul class='menu clearfix'>
    <li class='first'><a href='index.html'>Home</a></li>
    <li><a href='manual.html'>Manual</a></li>
    <li class='last'><a href='code.html'>Code</a></li>
  </ul>
  <a class='mapbox' href='http://www.mapbox.com' target='_blank'>A Product of Mapbox</a>
</div>

<div class='page'>
<div class='limiter clearfix'>
<div class='navigation'><ul></ul></div>
<pre class='md column-75'>" > pages/changelog.html

export CHANGELOG=$(cat CHANGELOG.md)

cat CHANGELOG.md >> pages/changelog.html

echo "</pre>
</div>
</div>

</body>
</html>" >> pages/changelog.html

pwd
echo "Updated pages/changelog.html."
