module("LabConnector");

test("Experiment Results", function() {
	expect(1); //We are only testing for 1 assertion
    
	//We want to write an #experimentresultsdialog so that it can be processed 
	var divElement = document.createElement("div");
	document.body.appendChild(divElement);
	divElement.id = "experimentresultsdialog";
	
	//We want to stub the $.get() calls as this is more integration than unit testing
	//Based on: http://stackoverflow.com/questions/522437/qunit-parameterized-tests-and-mocking
	var options = null;
	jQuery.ajax = function(param)
	{
		options = param;
	};
	
	loadExperimentResults("TestParam");
	options.success({p : null}); //We want to assign null to the data
	
	var expectedValue = "<div class=\"dialogcentercontent\">" +
	"	<div class=\"dialogheader\">" +
	"   </div>" +
	"   <pre>" + "[object Object]" + 
	"   </pre>" +
	"   </div>";
	
	same($("#experimentresultsdialog").html(), expectedValue);
});

test("Experiment Entry Information", function() {
	expect(1); //We are only testing for 1 assertion

	//We want to write an #experimentresultsdialog so that it can be processed 
	var pid  = "1";
	var divElement = document.createElement("div");
	document.body.appendChild(divElement);
	divElement.id = "experimentdialog" + pid;
	
	//We want to stub the $.get() calls as this is more integration than unit testing
	//Based on: http://stackoverflow.com/questions/522437/qunit-parameterized-tests-and-mocking
	var options = null;
	jQuery.ajax = function(param)
	{
		options = param;
	};
	
	loadExperimentEntryInfo(pid, "TestdisplayName");
	options.success({p : null}); //We want to assign null to the data
	
	//var expectedValue = '<div id="experimentdialog' + pid + '"></div>';
	var expectedValue = "Div";
	var result = new String($("#experimentdialog" + pid)[0]);
	same(result.substring(12,15), expectedValue);
});