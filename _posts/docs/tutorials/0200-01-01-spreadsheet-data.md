---
layout: book
section: documentation
category: tutorials
title: Spreadsheet data
permalink: /docs/tutorials/spreadsheet-data
---
TileMill makes it easy to style your geospatial data and render it into an interactive map for web, print, or mobile. By using the CSS-like map styling language Carto, anyone can create and share custom maps in short order.

But what do you do when you don't have geospatial data? Let's say you have a spreadsheet of addresses with some information you'd like to plot on a map. Here's one way to get arbitrary address point data into an interactive map using [Google Refine](http://code.google.com/p/google-refine), an awesome open source tool for working with data.

## Getting Started

First, let's find a dataset to work with. I'm going to [download a CSV](http://download.recovery.gov/recipient/Y10Q4/All_ContractsY10Q4.csv.zip) spreadsheet of Recovery Act contracts in the fourth quarter of 2010 from [Recovery.gov](http://www.recovery.gov/FAQ/Pages/DownloadCenter.aspx).
 
Next, I'm going to open Google Refine and create a new project using my CSV file from Recovery.gov. Instructions on installing Google Refine [are here](http://code.google.com/p/google-refine/wiki/Downloads).

![Google Refine: creating a new project](http://img.skitch.com/20110428-c7n3emx8y2jwcdxcsmp7ksgtfd.jpg)

![Google Refine: Recovery Act data loaded into the interface](http://img.skitch.com/20110429-f2kpewcdis8auf8kypfk269rjc.jpg)

## Geocoding

Now we have a dataset--great. The next step is to find the matching geographic coordinates for each address in the file. Refine lets you add new columns of information to your dataset by calling a web service. This means I can send my address fields (pop_st_address_1, pop_st_address_2 pop_state_cd,pop_country_cd, pop_city, pop_postal_cd) to a geocoding API like [Yahoo PlaceFinder](http://developer.yahoo.com/geo/placefinder/) or [Google Maps](http://code.google.com/apis/maps/documentation/geocoding/) and get back geocodes (Please remember to check each service's terms of service.) 

### A quick overview on using a geocoding API

Geocoding APIs, web services that accept an address and return coordinates, usually work by putting all of your address information in a url to request coordinates from the geocoding server. For instance, for Yahoo Placefinder, the url is formatted as follows:

First you need a base url for the geocoding server:

    http://where.yahooapis.com/geocode?

[Now get an API key from Yahoo on this page.](http://developer.yahoo.com/dashboard/createKey.html) - specify any application name and description, and you won't need the optional BOSS Search API or private data.

Next, include your key, so Yahoo knows who you are and can enforce its rate limiting:

    appid=[your Yahoo Placefinder API key goes here]

Then you need to add `flags=J` to the request so that the response from the geocoder is properly formed for use in Refine (this results in a [JSON format](http://www.json.org/) response rather than XML).

    &flags=J

Finally, the last part of the url is the address we want to geocode. Here we're using the White House's address, but for our sample dataset, we'll need to make this part by joining together a few separate address fields.

    &q=1600 Pennsylvania Ave Washington DC

Try it! Copy the following url to your browser and see the response you get back from the geocoder:

    http://where.yahooapis.com/geocode?flags=J&q=1600 Pensylvania Ave Washington DC

The response should be in JSON format, and will not be very readable in your browser, but thats okay. If you want to see the JSON printed in a more readible way try copy and pasting the result into the <a href="http://jsonlint.com/">JSONLint</a> site, which validates and formats json snippets to confirm they will work:

![](/tilemill/assets/pages/spreadsheet-data1.png)

### Applying the geocoding API to each address in our dataset

First, note that this sample dataset is really large. For the first run you should likely test with a smaller subset  (you can use facets in google refine to limit records) or some very simple sample data you create yourself.

To begin, add a new column to your dataset based on an address field by fetching a url.

![Add a new column to your dataset by fetching urls, based on an address field](http://img.skitch.com/20110429-df6pniycjjwngcrp2w5cch2fer.jpg)

- Give your new column a name, something like `api_response` works well
- Set a throttle delay, or how many milliseconds to wait between each API call--consult the terms of service for the geocoding API to see if they have rate limiting
- Enter an expression that joins data from the appropriate address columns and passes it to the geocoding API

Note: in the below code replace `[YOUR_YAHOO_API_KEY]` with your key.

    "http://where.yahooapis.com/geocode?appid=[YOUR_YAHOO_API_KEY]&flags=J&q="+escape(
      join(
        [
          forNonBlank(cells.pop_st_address_1.value, v, v, ""), 
          forNonBlank(cells.pop_st_address_2.value, v, v, ""),  
          forNonBlank(cells.pop_city.value, v, v, ""), 
          forNonBlank(cells.pop_state_cd.value, v, v, ""),
          forNonBlank(cells.pop_postal_cd.value, v, v, "")
        ],
        " "),
      "url"
    )

![Screenshot of Fetch By URL settings](http://img.skitch.com/20110513-ppgujy9hrmrd5cmfd5injgh6nn.jpg)
		
This should look very familiar: the expression starts with the geocoder's base url, adds the API key (don't forget to change this to your actual API key), adds the response flags, and formats our address. In this example, I'm forming the address parameter by joining all the non-blank address fields for each row by a space. Then I'm escaping any characters that shouldn't be in the url, and adding it to the end of my url.

If you want to use this expression on another project, make sure to set the `cell.[your_column].value` lines to the address columns of your project. If you have less address columns, delete the extra lines; if you have more, add more by copying a line and adding it after the last `forNonBlank...` line in this list. Make sure every line EXCEPT the last one ends in a comma (,).

For example, given a different spreadsheet that looks like this:

![](/tilemill/assets/pages/spreadsheet-data2.png)

Your refine geocoding expression would look like:

    "http://where.yahooapis.com/geocode?appid=[YOUR_YAHOO_API_KEY]&flags=J&q="+escape(
      join(
      [
        forNonBlank(cells.name.value, v, v, "")
      ],
      " "),
      "url"
    )

When I click OK, Refine will make this url for each row in the dataset, request it, and then store the response in a new column. This process may take some time to complete.

Note 1: This Recovery dataset is big&mdash;about 32,000 records&mdash;and it took me about three hours for the geocoding to finish. If you'd like to speed up the process, you can work with a smaller sample of your data.

Note 2: Your responses will not be perfect. In cases where you receive multiple responses, you may want to manually edit the cell include your preferred response. In cases where you receive no response, you may want to make your address more specific and try again.

![Finished responses from the geocoding API](http://img.skitch.com/20110429-dfbxgb4nk9yqwq91e1yijtk18y.jpg)

### Extracting coordinates to separate columns

In order to make it easier to work with our coordinates, let's extract them to separate columns. To do this, we'll have Refine parse our `api_response` column for the `latitude` and `longitude` properties and create new columns with their values.

- Add a new column based on the column with your API response
![Add a new column base on the column with your API response](http://img.skitch.com/20110429-nxn9dbjymway33urrn23a22e9g.jpg)
- Name the column `latitude` and enter the following expression:

		value.parseJson()["ResultSet"]["Results"][0].latitude
- Save and repeat the process to `longitude`:

		value.parseJson()["ResultSet"]["Results"][0].longitude

### Hiding rows with no geocodes

Since our primary purpose is to plot this data on a map, we don't need rows without geocodes. To hide them, select your `longitude` column, select `facet > customized facets > facet by blanks`, and then click `false` under the facet menu that now appears to the left.

![Facet your data by blank to remove rows with no geocodes](http://img.skitch.com/20110429-xwtuiiqkq7p9ajre1xfka359p7.jpg)

You should now have a complete dataset with geocodes for each valid address. Now we just need to get this data into TileMill and start making our map!


## Exporting GeoJSON from Refine

Now that we have a dataset with geocodes, we can format it as GeoJSON&mdash;a text-based data format that TileMill supports. Refine supports exporting data in several formats, but what's most interesting to us is its export templating feature. This allows us to write a custom text-based template for our data, and it is preset to JSON.

- Go to `Export` and select `Templating`
![Exporting template data](http://img.skitch.com/20110429-bk7mjfch892jwx6iuqhfhgfsg3.jpg)

- Enter the following for your `Prefix`:

		{
		  "type": "FeatureCollection",
		  "features": [
		
- Add the following to the top of your `Row Template` but do not delete the preset values in this box. If you reuse this template for another project, make sure that the `id` attribute is set to a unique value in your data instead of `award_key` and your coordinates definitions match the columns with your coordinates, defined here in the geometry attribute:

		  { 
		    "type": "Feature",
		    "id": {{jsonize(cells["award_key"].value)}},
		    "geometry": { "type": "Point", "coordinates": [{{cells["longitude"].value}}, {{cells["latitude"].value}}] }, 
		    "properties": 
		
- Add an extra `  }` all the way at the bottom of your `Row Template`

- The rest of the defaults work for us, so we're ready to click `export`

![Screen shot of the geojson settings in the Export Template](http://img.skitch.com/20110513-3c89jy8mw41g68xu5we3anush.jpg)

- Find the text file refine just downloaded, rename it to include the file extension `.geojson`, and save it in Tilemill's /files/data directory.

## Adding a new layer to TileMill

Start up TileMill and make a new project. Add a new layer with an `SRS` of `WGS84` and find your GeoJSON file:

![New layer of geojson data](http://img.skitch.com/20110429-fxmtnttg8wa4t7ttrn392h9599.jpg)

From here, you can style your points any way you like. For a more in depth look at styling points in TileMill, check out [this article](http://support.mapbox.com/kb/tilemill/styling-point-data-using-tilemill).

Here are just a few quick lines of style to get a sense of Recovery Act spending on a national scale:

	#recovery-contracts {
	  marker-height: 1;
	  marker-fill: #369;
	  marker-opacity: .5;
	  marker-line-width: 0;
	  [local_amount >  1000000] { marker-height: 10; }
	  [local_amount <= 1000000] { marker-height: 8; }
	  [local_amount <  500000] { marker-height: 6; } 
	  [local_amount <  100000] { marker-height: 4; } 
	  [local_amount <  50000] { marker-height: 2; } 
	  [local_amount <  10000] { marker-height: 1; } 
	}
	
![Sample styling for points](http://img.skitch.com/20110429-deuxjq88mdtfajwhdahj4yet76.jpg)

## Adding Interactivity

This map gives us a general sense for where Recovery Act money went last quarter. We could make it more powerful but putting the data in context using additional layers for population and recent economic conditions. But let's say we want to discover more information about these projects. To do this, I'm going to use a new feature available first in the [TileMill 0.2.0 release called interactivity](http://developmentseed.org/blog/2011/may/16/tilemill-020-release).

I'm going to add a project name and description overlay when a user hovers over a point, and add a full project profile when a user clicks a point.

- Click `settings > interactivity` and pick the layer from which you want to use data.
- Set `Key name` to a unique value in your dataset. In this case `award_key` works well

You'll notice two fields: a `Teaser`, which displays content in a overlay on mouse-over, and `Full`, which displays content on click. You'll also notice tokens that you can drop in for any of the fields in your dataset.

I'm going to set up my `Teaser` with the following code to give me the name and description of each project. Note these fields support HTML markup.

	<strong>[recipient_name]</strong><br />
	[project_description]<br />
	<p><em>Click for more information</em></p>

And I'll set up my `Full` with the following:

	<strong>[recipient_name]</strong><br />
	Award Date: [award_date]<br />
	Project status: [project_status]<br />
	Funding Amount: [local_amount]<br />
	Funded by: [funding_agency_name]<br />
	Jobs funded: [job_creation]

Once TileMill's had a chance to process the interactivity settings, you'll see your overlays and on-click pop-ups in the preview window. That interactivity will work on maps embedded from Tile Stream Hosting and in the [1.3 release of MapBox for iPad](http://developmentseed.org/blog/2011/may/24/mapbox-ipad-13-released).

## The Finished Product

Now I'm ready to share my map, so I'll export it to MBTiles and load it into my [MapBox Hosting](http://mapbox.com/hosting) account. Now I can embed it on any webpage: http://tiles.mapbox.com/dhcole/#/map/map_1304106306810

![Finished map of Recovery Act Projects](http://img.skitch.com/20110515-f2aj7fpamc4yha7ghsmmxhecxu.jpg)

Embed code:

    <div id='ts-embed-1305426544377-script'><script src='http://tiles.mapbox.com/dhcole/api/v1/embed.js?api=ol&size%5B%5D=630&size%5B%5D=400&center%5B%5D=-74.992675763906&center%5B%5D=40.149488205192&center%5B%5D=8&layers%5B%5D=world-bright-test&layers%5B%5D=recovery-map_d623b4&options%5B%5D=legend&options%5B%5D=zoompan&options%5B%5D=tooltips&options%5B%5D=zoomwheel&el=ts-embed-1305426544377'></script></div>

