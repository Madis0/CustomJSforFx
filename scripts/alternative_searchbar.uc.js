// 'Alternative search bar' script for Firefox 85+ by Aris
//
// Thanks to UndeadStar (aka BoomerangAide) for Fx 69+ improvements
// https://github.com/Aris-t2/CustomJSforFx/issues/11
//
// Thanks to samehb (aka Sameh Barakat) for Fx 68-75+ improvements 
// https://github.com/Aris-t2/CustomJSforFx/issues/11
//
// Thanks to anomiex for the setIcon workaround on Fx 77+
// https://github.com/Aris-t2/CustomJSforFx/issues/33
//
// Idea based on 'search revert' script by '2002Andreas':
// https://www.camp-firefox.de/forum/viewtopic.php?f=16&t=112673&start=2010#p1099758
//
// Initial "old search" script ported from old Firefox versions by Aris
//
//
// Feature (not optional): search glass is always visible at search bars end (like with "old" search)
// Feature (not optional): search button shows current search engines icon (like with "old" search)
// Feature (not optional): search buttons dropmarker is always visible (like with "old" search)
//
// Option: clear search input after search
// Option: revert to first search engine in list after search
// Option: old search engine selection popup
// Option: hide 'add engines' '+' indicator
// Option: hide 'oneoff' search engines (engines at popups bottom)
// Option: hide placeholder text 'Search'
// Option: swap the icons of search engine button and go button
// Option: show icons and search engine names instead of only icons
// Option: select search engine by scrolling mouse wheel over search bars button

// [!] Default browser feature: search engine can be changed inside default/modern popup by right-clicking
//     search icon and selecting 'Set As Default Search Engine' menuitem.


// Configuration area - start (all 'false' by default)
var clear_searchbar_after_search = false; // clear input after search (true) or not (false)
var revert_to_first_engine_after_search = false; // revert to first engine (true) or not (false)
var old_search_engine_selection_popup = false; // show old search engine selection popup (true) or not (false)
var select_engine_by_scrolling_over_button = false; // select search engine by scrolling mouse wheel over search bars button (true) or not (false)
var select_engine_by_click_oneoffs_button = false; // select search engine by left-clicking search icon
var hide_oneoff_search_engines = false; // hide 'one off' search engines (true) or not (false)
var hide_addengines_plus_indicator = false; // hide add engines '+' sign (true) or not (false)
var hide_placeholder = false; // hide placeholder (true) or not (false)
var switch_glass_and_engine_icon = false; // swap icons of search engine button and go button (true) or not (false)
var show_search_engine_names = false; // show search engine names (true) or not (false)
var show_search_engine_names_with_scrollbar = false; // show search engine names with scrollbars (true) or not (false)
var show_search_engine_names_with_scrollbar_height = '170px'; // higher values show more search engines
var initialization_delay_value = 0; // some systems might require a higher value than '1' second (=1000ms) and on some even '0' is enough
var searchsettingslabel = "Change Search Settings";
// Configuration area - end

var isInCustomize = 1; //start at 1 to set it once at startup

Cu.import('resource://gre/modules/Services.jsm');

var AltSearchbar = {
 init: async function() {
   await Services.search.wrappedJSObject.init();

   if (appversion >= 76 && location != 'chrome://browser/content/browser.xhtml')
    return;

   window.removeEventListener("load", AltSearchbar.init, false);

   try {
	   
	var searchbar = document.getElementById("searchbar");
	var appversion = parseInt(Services.appinfo.version);

	if(!old_search_engine_selection_popup)
	  updateStyleSheet();
	
	if(hide_placeholder)
	  hideSearchbarsPlaceholder();

	if(select_engine_by_scrolling_over_button)
	  selectEngineByScrollingOverButton();

	if(old_search_engine_selection_popup)
	  createOldSelectionPopup();

    if (select_engine_by_click_oneoffs_button)
      selectEngineByClickOneoffsButton();

	// select search engine by scrolling mouse wheel over search bars button
	function selectEngineByScrollingOverButton() {
	  searchbar.addEventListener("DOMMouseScroll", (event) => {
		if (event.originalTarget.classList.contains("searchbar-search-button")) {
          searchbar.selectEngine(event, event.detail > 0);
		}
	  }, true);
	};

    // left click on off select engine
    function selectEngineByClickOneoffsButton() {
        var searchoneoffs = searchbar.textbox.popup.oneOffButtons;
        searchoneoffs.container.addEventListener("click", (event) => {
            if (!(event instanceof KeyboardEvent) && (event.button == 0)) {
                event.stopPropagation();
                event.target.classList.add("search-one-offs-context-set-default");
                searchoneoffs._contextEngine = event.target.engine;
            }
        }, true);
    };
    
	// hide placeholder
	function hideSearchbarsPlaceholder() {
	  searchbar.getElementsByClassName('searchbar-textbox')[0].removeAttribute("placeholder");
	};

	function attachOldPopupToButton(e) {
		if(isInCustomize == 1) {
			setTimeout(function () { searchbar.getElementsByClassName("searchbar-search-button")[0].setAttribute("popup", "searchbuttonpopup"); }, initialization_delay_value);
		}
		if(isInCustomize > 0)
			isInCustomize--;
	}

	// old search selection popup
	async function createOldSelectionPopup() {

		searchbar.engines = await Services.search.getVisibleEngines();
		
		window.addEventListener("beforecustomization", function(e) { isInCustomize++; }, false);
		window.addEventListener("aftercustomization", attachOldPopupToButton, false);		

		// set new search engine
		searchbar.setNewSearchEngine = function(index) {
			searchbar.currentEngine = searchbar.engines[index];
			updateStyleSheet();
		};

		// create search popup
		searchbuttonpopup = document.createXULElement("menupopup");
		searchbuttonpopup.setAttribute("id", "searchbuttonpopup");
		searchbuttonpopup.setAttribute("width", searchbar.getBoundingClientRect().width - 6 );
		searchbuttonpopup.setAttribute("position", "after_start");
	  
		try {
			
			var hidden_list = Services.prefs.getStringPref("browser.search.hiddenOneOffs");
			hidden_list =  hidden_list ? hidden_list.split(",") : [];					

			for (var i = 0; i <= searchbar.engines.length - 1; ++i) {
						
				if(!hidden_list.includes(searchbar.engines[i].name)) {
						
					menuitem = document.createXULElement("menuitem");;
					menuitem.setAttribute("label", searchbar.engines[i].name);
					menuitem.setAttribute("tooltiptext", searchbar.engines[i].name);
							menuitem.setAttribute("class", "menuitem-iconic searchbar-engine-menuitem menuitem-with-favicon");
			
					if (searchbar.engines[i] == searchbar.currentEngine)
							menuitem.setAttribute("selected", "true");
			
					if (searchbar.engines[i].iconURI)
						menuitem.setAttribute("image",searchbar.engines[i].iconURI.spec);
							
							menuitem.setAttribute("oncommand", "document.getElementById('searchbar').setNewSearchEngine("+i+")");

							searchbuttonpopup.appendChild(menuitem);
							
						}
	  
					}
		
					menuseparator_om = document.createXULElement("menuseparator");
					searchbuttonpopup.appendChild(menuseparator_om);

					menuitem_om = document.createXULElement("menuitem");
					if(appversion > 71)
						menuitem_om.setAttribute("data-l10n-id", "search-one-offs-change-settings-button");
					else
						menuitem_om.setAttribute("label", searchsettingslabel);
					menuitem_om.setAttribute("class", "open-engine-manager");
					menuitem_om.setAttribute("oncommand", "openPreferences('search');");
					searchbuttonpopup.appendChild(menuitem_om);	

					updateStyleSheet();
		
		} catch(exc) {
		  console.log("Exception AltSearchbar: " + exc);
		}

	  document.getElementById("mainPopupSet").appendChild(searchbuttonpopup);

	  // adjust popup width
	  setTimeout(function(){
		document.getElementById('searchbuttonpopup').setAttribute("width", document.getElementById("searchbar").getBoundingClientRect().width);
	  },1000);

	  var observer_width = new MutationObserver(function(mutations,observer) {
		observer.disconnect();
		try {
		  document.getElementById('searchbuttonpopup').setAttribute("width", document.getElementById("searchbar").getBoundingClientRect().width );
		} catch(e){}
		observer.observe(document.getElementById('search-container'), { attributes: true, attributeFilter: ['width'] });
		observer.observe(document.getElementById('main-window'), { attributes: true, attributeFilter: ['sizemode'] });
	  });

	  try {
		observer_width.observe(document.getElementById('search-container'), { attributes: true, attributeFilter: ['width'] });
		observer_width.observe(document.getElementById('main-window'), { attributes: true, attributeFilter: ['sizemode'] });
	  } catch(e){}
	  
	  // restore "add search engine" menuitem

	  // attach new popup to search bars search button
	  try {
		attachOldPopupToButton();	
	  }
	  catch(e) {
		  console.log("AltSearchbar: Failed to attach new popup to search bar search button");
	  }
	  
	// Refresh the script's search popup (searchbuttonpopup) with any changes made to search engines/options.
	async function updateEngines() {
    var i;

    try {

        searchbuttonpopup = document.getElementById("searchbuttonpopup");

        searchbar.engines = await Services.search.getVisibleEngines();

        try {

            while (searchbuttonpopup.childNodes[0].tagName.toLowerCase() != "menuseparator")
                searchbuttonpopup.removeChild(searchbuttonpopup.firstChild);

            var separator = searchbuttonpopup.childNodes[0];

            var hidden_list = Services.prefs.getStringPref("browser.search.hiddenOneOffs");
            hidden_list = hidden_list ? hidden_list.split(",") : [];

            for (i = 0; i <= searchbar.engines.length - 1; ++i) {

                if (!hidden_list.includes(searchbar.engines[i].name)) {

                    menuitem = document.createXULElement("menuitem");;
                    menuitem.setAttribute("label", searchbar.engines[i].name);
                    menuitem.setAttribute("class", "menuitem-iconic searchbar-engine-menuitem menuitem-with-favicon");
                    menuitem.setAttribute("tooltiptext", searchbar.engines[i].name);

                    if (searchbar.engines[i] == searchbar.currentEngine)
                        menuitem.setAttribute("selected", "true");

                    if (searchbar.engines[i].iconURI)
                        menuitem.setAttribute("image", searchbar.engines[i].iconURI.spec);

                    menuitem.setAttribute("oncommand", "document.getElementById('searchbar').setNewSearchEngine(" + i + ")");

                    searchbuttonpopup.insertBefore(menuitem, separator);

                }

            }

            updateStyleSheet();

        } catch (exc) {
            console.log(exc);
        }

    } catch (exc) {
        console.log("update altbar exc: " + exc);
    }
}

// Used to observe modifications made to search engines. We are only interested in the addition and removal of engines.
Services.obs.addObserver(function observer(subject, topic, data) {
    // If a search engine/option is added or removed, we need to refresh the script's popup. We use updateEngines() to do that.
    if (data == "engine-added" || data == "engine-removed" || data == "engine-changed") {
        updateEngines();
	}
}, "browser-search-engine-modified");

// Observe the enabling and disabling of search engines, and update the search popup.
Services.prefs.addObserver("browser.search.hiddenOneOffs", function observer(subject, topic, data) {
   updateEngines();
});

// Used to create an add engine item and append it into the script's search popup (searchbuttonpopup). This is the option
// that is displayed as "Add enginename" e.g. Add DuckDuckGo.
function createAddEngineItem(e) {
    try {
        e.target.removeEventListener(e.type, arguments.callee);

        searchbuttonpopup = document.getElementById("searchbuttonpopup");
        var native_popup_search_add_item = document.getElementsByClassName("search-add-engines")[0];

        if (native_popup_search_add_item.hasChildNodes()) {

            var add_engine_menuitem;

            while (searchbuttonpopup.lastChild.classList.contains("custom-addengine-item")) {
                searchbuttonpopup.removeChild(searchbuttonpopup.lastChild);
            }

            if (searchbuttonpopup.lastChild.tagName.toLowerCase() != "menuseparator") {
                searchbuttonpopup.appendChild(document.createXULElement("menuseparator"));
                searchbuttonpopup.appendChild(document.createXULElement("menuseparator"));
            }

			native_popup_search_add_item.childNodes.forEach(function (child_node) {
				menuitem = document.createXULElement("menuitem");
				menuitem.setAttribute("label", child_node.getAttribute("label"));
				menuitem.setAttribute("class", "menuitem-iconic searchbar-engine-menuitem menuitem-with-favicon custom-addengine-item");
				menuitem.setAttribute("tooltiptext", child_node.getAttribute("label"));
				menuitem.setAttribute("uri", child_node.getAttribute("uri"));
				menuitem.setAttribute("data-id", child_node.id);
				menuitem.setAttribute("oncommand", "document.getElementById(\"" + child_node.id + "\").click();");

				if (child_node.hasAttribute("image"))
					menuitem.setAttribute("image", child_node.getAttribute("image"));

				searchbuttonpopup.appendChild(menuitem);

			});

        } else {

            while (searchbuttonpopup.lastChild.classList.contains("custom-addengine-item")) {
                searchbuttonpopup.removeChild(searchbuttonpopup.lastChild);
            }

            while (searchbuttonpopup.lastChild.tagName.toLowerCase() == "menuseparator")
                searchbuttonpopup.removeChild(searchbuttonpopup.lastChild);

        }

    } catch (exc) {
        console.log("custom addengine exc: " + exc);
    }
}

	  searchbar.addEventListener("mousedown", (event) => {
		var defaultPopup = document.getElementById("PopupSearchAutoComplete"); // Browser's default search popup.
		var scriptPopup = document.getElementById("searchbuttonpopup");
		var addEngineItem = document.getElementsByClassName("custom-addengine-item")[0];
		var searchButton = document.getElementsByClassName("searchbar-search-button")[0];

		// hasAddEnginesAttribute == true means there is a search engine provided by the page, for us to add using "Add enginename."
		// You will see a green plus badge on the search button icon, if that is the case.
		var hasAddEnginesAttribute = searchButton.hasAttribute("addengines");

		// Skip clicks on the search button until searchbuttonpopup is available. Disable propagation, too.
		if (!scriptPopup) {
			event.stopPropagation();
			return;
		}

		defaultPopup.style.visibility = "visible";

		// If the user clicks on any element on the search bar except the search text.
		if (event.target.getAttribute("class") != "searchbar-textbox") {

			// In case the default search popup is shown, hide it.
			defaultPopup.hidePopup();

			// Propagation causes PopupSearchAutoComplete to be shown, which in turn causes search-add-engines to be populated.
			// We monitor the PopupSearchAutoComplete and after it is shown, we use createAddEngineItem() to create the add
			// engine item and populate the script's popup (searchbuttonpopup). Propagation causes PopupSearchAutoComplete to be 
			// displayed with searchbuttonpopup, at the same time (when the user clicks the search button). Displaying 
			// PopupSearchAutoComplete with every search button click is inefficient. We allow propagation only when it is needed, 
			// and we set the PopupSearchAutoComplete visibility to collapse, so we do not see it with the script's popup.

			// If there are no changes to be done to the searchbuttonpopup, go ahead and skip propagation.
			// If there is an engine to be added, and the engine item is already available on the script's popup, there are no changes.
			// If there is no engine to be added, and there is no engine item, that also means that there are no changes needed.
			// On the other hand, if hasAddEnginesAttribute and addEngineItem are not synchronized, we need to apply propagation
			// to refresh the searchbuttonpopup. We set the addEngineItem visibility to collapse, and allow propagation.
			if ((hasAddEnginesAttribute && addEngineItem && addEngineItem.hasAttribute("image") && document.getElementById(addEngineItem.getAttribute("data-id")) && gBrowser.currentURI.spec.includes(addEngineItem.getAttribute("uri").match(/.+:\/\/([^\/]+)\//)[1])) || (!hasAddEnginesAttribute && !addEngineItem))
				event.stopPropagation();
			else {
				defaultPopup.style.visibility = "collapse";
				defaultPopup.addEventListener("popupshown", createAddEngineItem, false);
			}
		}

		searchbar.focus();

	  }, true);

	}; //createOldSelectionPopup
	
	// doSearch function taken from Firefox 85+ internal 'searchbar.js' file and added modifications
    searchbar.doSearch = function(aData, aWhere, aEngine, aParams, isOneOff = false) {
      let textBox = this._textbox;
      let engine = aEngine || this.currentEngine;

      // Save the current value in the form history
      if (
        aData &&
        !PrivateBrowsingUtils.isWindowPrivate(window) &&
        this.FormHistory.enabled &&
        aData.length <=
          this.SearchSuggestionController.SEARCH_HISTORY_MAX_VALUE_LENGTH
      ) {
        this.FormHistory.update(
          {
            op: "bump",
            fieldname: textBox.getAttribute("autocompletesearchparam"),
            value: aData,
            source: engine.name,
          },
          {
            handleError(aError) {
              Cu.reportError(
                "Saving search to form history failed: " + aError.message
              );
            },
          }
        );
      }

      let submission = engine.getSubmission(aData, null, "searchbar");

      // If we hit here, we come either from a one-off, a plain search or a suggestion.
      const details = {
        isOneOff,
        isSuggestion: !isOneOff && this.telemetrySelectedIndex != -1,
        url: submission.uri,
      };

      this.telemetrySelectedIndex = -1;

      BrowserSearchTelemetry.recordSearch(
        gBrowser.selectedBrowser,
        engine,
        "searchbar",
        details
      );
      // null parameter below specifies HTML response for search
      let params = {
        postData: submission.postData,
      };
      if (aParams) {
        for (let key in aParams) {
          params[key] = aParams[key];
        }
      }
      openTrustedLinkIn(submission.uri.spec, aWhere, params);
	  
		if(clear_searchbar_after_search)
			this.value = '';
		  
		if(revert_to_first_engine_after_search) {
			searchbar.currentEngine = searchbar.engines[0];
			updateStyleSheet();
		}

    };
	
	// Workaround for the deprecated setIcon funtion
	var oldUpdateDisplay = searchbar.updateDisplay;
	searchbar.updateDisplay = function() {
	  oldUpdateDisplay.call(this);
	  updateStyleSheet();
	};
	
	// main style sheet
	function updateStyleSheet() {
	  var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);

	  var hide_oneoff_search_engines_code = '';
	  var show_search_engine_names_code = '';
	  var show_search_engine_names_with_scrollbar_code = '';
	  var hide_addengines_plus_indicator_code = '';
	  var switch_glass_and_engine_icon_code = '';

	  if(hide_oneoff_search_engines)
		hide_oneoff_search_engines_code=' \
		  #PopupSearchAutoComplete .search-panel-header, \
		  #PopupSearchAutoComplete .search-one-offs { \
			display: none !important; \
		  } \
		';

	  if(hide_addengines_plus_indicator)
	   hide_addengines_plus_indicator_code=' \
	     .searchbar-search-button[addengines=true]::after { \
		   visibility: hidden !important; \
		 } \
	   ';
		
	  if(show_search_engine_names && !hide_oneoff_search_engines && appversion == 69)
	   show_search_engine_names_code=' \
		#PopupSearchAutoComplete .search-panel-tree:not([collapsed="true"]) { \
		  display: block !important; \
		  width: 100% !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree:not([collapsed="true"]) > * { \
		  width: 100%; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item { \
		  -moz-appearance:none !important; \
		  min-width: 0 !important; \
		  width: 100% !important; \
		  border: unset !important; \
		  height: 22px !important; \
		  background-image: unset !important; \
		  -moz-padding-start: 3px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item:not([tooltiptext]) { \
		  display: none !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item .button-box { \
		  position: absolute !important; \
		  -moz-padding-start: 4px !important; \
		  margin-top: 3px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item::after { \
		  -moz-appearance: none !important; \
		  display: inline !important; \
		  content: attr(tooltiptext) !important; \
		  position: relative !important; \
		  top: -9px !important; \
		  -moz-padding-start: 25px !important; \
		  min-width: 0 !important; \
		  width: 100% !important; \
		  white-space: nowrap !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="21"] { \
		  min-height: 21px !important; \
		  height: 21px !important; \
		  max-height: 21px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="42"] { \
		  min-height: 42px !important; \
		  height: 42px !important; \
		  max-height: 42px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="63"] { \
		  min-height: 63px !important; \
		  height: 63px !important; \
		  max-height: 63px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="84"] { \
		  min-height: 84px !important; \
		  height: 84px !important; \
		  max-height: 84px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="105"] { \
		  min-height: 105px !important; \
		  height: 105px !important; \
		  max-height: 105px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="126"] { \
		  min-height: 126px !important; \
		  height: 126px !important; \
		  max-height: 126px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="147"] { \
		  min-height: 147px !important; \
		  height: 147px !important; \
		  max-height: 147px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="168"] { \
		  min-height: 168px !important; \
		  height: 168px !important; \
		  max-height: 168px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="189"] { \
		  min-height: 189px !important; \
		  height: 189px !important; \
		  max-height: 189px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="210"] { \
		  min-height: 210px !important; \
		  height: 210px !important; \
		  max-height: 210px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree scrollbar { \
		  display: none !important; \
		  visibility: collapse !important; \
		  opacity: 0 !important; \
		} \
		';

	  if(show_search_engine_names && !hide_oneoff_search_engines && appversion >= 70 && appversion < 72)
	   show_search_engine_names_code=' \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item { \
		  -moz-appearance:none !important; \
		  min-width: 0 !important; \
		  width: 100% !important; \
		  border: unset !important; \
		  height: 22px !important; \
		  background-image: unset !important; \
		  -moz-padding-start: 3px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item:not([tooltiptext]) { \
		  display: none !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item .button-box { \
		  position: absolute !important; \
		  display:block !important; \
		  -moz-padding-start: 4px !important; \
		  margin-top: 3px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item::after { \
		  -moz-appearance: none !important; \
		  display: inline !important; \
		  content: attr(tooltiptext) !important; \
		  position: relative !important; \
		  top: -9px !important; \
		  -moz-padding-start: 25px !important; \
		  min-width: 0 !important; \
		  width: 100% !important; \
		  white-space: nowrap !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs { \
		  min-height: unset !important; \
		  height: unset !important; \
		  max-height: unset !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree:not([collapsed="true"]) { \
		  width: 100% !important; \
		  display: block !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree:not([collapsed="true"]) > * { \
		  width: 100%; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="18"] { \
		  min-height: 18px !important; \
		  height: 18px !important; \
		  max-height: 18px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="36"] { \
		  min-height: 36px !important; \
		  height: 36px !important; \
		  max-height: 36px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="54"] { \
		  min-height: 54px !important; \
		  height: 54px !important; \
		  max-height: 54px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="72"] { \
		  min-height: 72px !important; \
		  height: 72px !important; \
		  max-height: 72px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="90"] { \
		  min-height: 90px !important; \
		  height: 90px !important; \
		  max-height: 90px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="108"] { \
		  min-height: 108px !important; \
		  height: 108px !important; \
		  max-height: 108px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="126"] { \
		  min-height: 126px !important; \
		  height: 126px !important; \
		  max-height: 126px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="144"] { \
		  min-height: 144px !important; \
		  height: 144px !important; \
		  max-height: 144px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="162"] { \
		  min-height: 162px !important; \
		  height: 162px !important; \
		  max-height: 162px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="180"] { \
		  min-height: 180px !important; \
		  height: 180px !important; \
		  max-height: 180px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree scrollbar { \
		  display: none !important; \
		  visibility: collapse !important; \
		  opacity: 0 !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree { \
		  overflow-y: hidden !important; \
		} \
   		';
		
	  if(show_search_engine_names && !hide_oneoff_search_engines && appversion >= 72)
	   show_search_engine_names_code=' \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item { \
		  -moz-appearance:none !important; \
		  min-width: 0 !important; \
		  width: 100% !important; \
		  border: unset !important; \
		  height: 22px !important; \
		  background-image: unset !important; \
		  -moz-padding-start: 3px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item:not([tooltiptext]) { \
		  display: none !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item .button-box { \
		  display: block !important; \
		  -moz-padding-start: 4px !important; \
		  margin-top: 3px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item::after { \
		  -moz-appearance: none !important; \
		  display: inline !important; \
		  content: attr(tooltiptext) !important; \
		  position: relative !important; \
		  top: -9px !important; \
		  -moz-padding-start: 25px !important; \
		  min-width: 0 !important; \
		  width: 100% !important; \
		  white-space: nowrap !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs { \
		  min-height: unset !important; \
		  height: unset !important; \
		  max-height: unset !important; \
		} \
   		';

	  if(show_search_engine_names_with_scrollbar && !hide_oneoff_search_engines && show_search_engine_names)
	   show_search_engine_names_with_scrollbar_code=' \
		#PopupSearchAutoComplete .search-one-offs { \
		  height: '+show_search_engine_names_with_scrollbar_height+' !important; \
		  max-height: '+show_search_engine_names_with_scrollbar_height+' !important; \
		  overflow-y: scroll !important; \
		  overflow-x: hidden !important; \
		} \
		\
		';

	  if(switch_glass_and_engine_icon)
	   switch_glass_and_engine_icon_code=' \
		.search-go-button { \
		  list-style-image: url('+document.getElementById("searchbar").currentEngine.iconURI.spec+') !important; \
		  transform: scaleX(1) !important; \
		} \
		.searchbar-search-button .searchbar-search-icon { \
		  list-style-image: url("chrome://global/skin/icons/search-glass.svg") !important; \
		  -moz-context-properties: fill, fill-opacity !important; \
		  fill-opacity: 1.0 !important; \
		  fill: #3683ba !important; \
		} \
		.searchbar-search-button:hover .searchbar-search-icon { \
		  fill: #1d518c !important; \
		} \
		.searchbar-search-button:active .searchbar-search-icon { \
		  fill: #00095d !important; \
		} \
		\
		';

	  var uri = Services.io.newURI("data:text/css;charset=utf-8," + encodeURIComponent(' \
		\
		#search-container{ min-width: 20px !important } \
		#searchbuttonpopup {\
		  -moz-margin-start: -1px; \
		} \
		.searchbar-search-button .searchbar-search-icon { \
		  list-style-image: url('+document.getElementById("searchbar").currentEngine.iconURI.spec+') !important; \
		} \
		.search-go-button { \
		  list-style-image: url("chrome://global/skin/icons/search-glass.svg") !important; \
		  -moz-context-properties: fill, fill-opacity !important; \
		  fill-opacity: 1.0 !important; \
		  fill: #3683ba !important; \
		  transform: scaleX(-1) !important; \
		  background: unset !important; \
		  margin-inline-end: 4px !important; \
		} \
		.search-go-button:hover { \
		  fill: #1d518c !important; \
		} \
		.search-go-button:active { \
		  fill: #00095d !important; \
		} \
		.search-go-button[hidden="true"] { \
		  display: block !important; \
		} \
		.searchbar-search-button[addengines=true] > .searchbar-search-icon-overlay, \
		.searchbar-search-button:not([addengines=true]) > .searchbar-search-icon-overlay { \
		  list-style-image: url("chrome://global/skin/icons/arrow-dropdown-12.svg") !important; \
		  -moz-context-properties: fill !important; \
		  margin-inline-start: -6px !important; \
		  margin-inline-end: 2px !important; \
		  width: 11px !important; \
		  height: 11px !important; \
		} \
		.searchbar-search-button[addengines=true] > .searchbar-search-icon-overlay { \
		  margin-top: 0px !important; \
		} \
		.searchbar-search-button[addengines=true]::after { \
		  content: " " !important; \
		  background: url("chrome://browser/skin/search-indicator-badge-add.svg") center no-repeat !important; \
		  display: block !important; \
		  visibility: visible !important; \
		  width: 11px !important; \
		  height: 11px !important; \
		  -moz-margin-start: 18px !important; \
		  margin-top: -11px !important; \
		  position: absolute !important; \
		} \
		.searchbar-search-button[addengines=true] > .searchbar-search-icon-overlay { \
		  visibility: visible !important; \
		} \
		 \
		.custom-addengine-item > .menu-iconic-left::after { \
		  position: absolute !important; \
		  display: block; !important; \
		  content: "" !important; \
		  background: url("chrome://browser/skin/search-indicator-badge-add.svg") no-repeat center !important; \
		  box-shadow: none  !important; \
		  margin-top: -12px !important; \
		  margin-inline-start: -4px !important; \
		  width: 11px; !important; \
		  height: 11px; !important; \
		  min-width: 11px; !important; \
		  min-height: 11px; !important; \
		} \
		'+hide_addengines_plus_indicator_code+' \
		'+hide_oneoff_search_engines_code+' \
		'+show_search_engine_names_code+' \
		'+show_search_engine_names_with_scrollbar_code+' \
		'+switch_glass_and_engine_icon_code+' \
		\
	  '), null, null);

	  // remove old style sheet
	  if (sss.sheetRegistered(uri,sss.AGENT_SHEET)) {
		sss.unregisterSheet(uri,sss.AGENT_SHEET);
	  }

	  sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);

	};

   } catch(e) {} 

 }
}

/* if search is not hidden on current window, wait for searchbar loading and then initialize 'alternative search' (with delay) */
if(!document.firstElementChild.hasAttribute("chromehidden") || !document.firstElementChild.getAttribute("chromehidden").includes("toolbar")) {
	if (document.readyState === "complete") {
		setTimeout(AltSearchbar.init, initialization_delay_value);
	}
	else {
		window.addEventListener("load", AltSearchbar.init, false);
	}
}
