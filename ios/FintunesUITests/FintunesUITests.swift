//
//  FintunesUITests.swift
//  FintunesUITests
//
//  Created by Lei Nelissen on 13/06/2022.
//

import XCTest

class FintunesUITests: XCTestCase {
  
  override func setUpWithError() throws {
    // Put setup code here. This method is called before the invocation of each test method in the class.
    
    // In UI tests it is usually best to stop immediately when a failure occurs.
    continueAfterFailure = false
    
    // In UI tests it’s important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.
  }
  
  override func tearDownWithError() throws {
    // Put teardown code here. This method is called after the invocation of each test method in the class.
  }
  
  func testExample() throws {
    // UI tests must launch the application that they test.
    let app = XCUIApplication()
    setupSnapshot(app)
    app.launch()
    
    // Use XCTAssert and related functions to verify your tests produce the correct results.
    snapshot("04RecentAlbums");
    app.otherElements["all-albums"].tap();
    snapshot("05AlbumsScreen");
    app.buttons["search-tab"].tap();
    app.textFields["search-input"].tap();
    app.textFields["search-input"].typeText("bicep");
    snapshot("03SearchScreen");
    if app.otherElements["search-result-a644f8d23821601d2feb86ddae5e64f4"].waitForExistence(timeout: 5) {
      app.otherElements["search-result-a644f8d23821601d2feb86ddae5e64f4"].tap();
      app.otherElements["search-result-a644f8d23821601d2feb86ddae5e64f4"].tap();
      snapshot("02AlbumScreen");
    }
    if app.otherElements["play-album"].waitForExistence(timeout: 5) {
      app.otherElements["play-album"].tap();
    }
    if app.otherElements["open-player-modal"].waitForExistence(timeout: 5) {
      app.otherElements["open-player-modal"].tap();
      snapshot("01PlayModal");
    }
  }
  
//  func testLaunchPerformance() throws {
//    if #available(macOS 10.15, iOS 13.0, tvOS 13.0, watchOS 7.0, *) {
//      // This measures how long it takes to launch your application.
//      measure(metrics: [XCTApplicationLaunchMetric()]) {
//        XCUIApplication().launch()
//      }
//    }
//  }
}
