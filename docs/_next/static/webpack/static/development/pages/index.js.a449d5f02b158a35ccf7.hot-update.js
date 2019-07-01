webpackHotUpdate("static/development/pages/index.js",{

/***/ "./components/Resume/DateRange/DateRange.js":
/*!**************************************************!*\
  !*** ./components/Resume/DateRange/DateRange.js ***!
  \**************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/defineProperty */ "./node_modules/@babel/runtime-corejs2/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var duration__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! duration */ "./node_modules/duration/index.js");
/* harmony import */ var duration__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(duration__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var pluralize__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! pluralize */ "./node_modules/pluralize/pluralize.js");
/* harmony import */ var pluralize__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(pluralize__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! classnames */ "./node_modules/classnames/index.js");
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var _shapes_dateFormatShape__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../../shapes/dateFormatShape */ "./shapes/dateFormatShape.js");
/* harmony import */ var _DateRange_scss__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./DateRange.scss */ "./components/Resume/DateRange/DateRange.scss");
/* harmony import */ var _DateRange_scss__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(_DateRange_scss__WEBPACK_IMPORTED_MODULE_12__);






var _jsxFileName = "/Users/mhuggins/Development/matthuggins.com/components/Resume/DateRange/DateRange.js";







var DEFAULT_FORMAT = {
  year: "numeric",
  month: "short"
};

var DateRange =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_4__["default"])(DateRange, _React$Component);

  function DateRange() {
    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, DateRange);

    return Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_2__["default"])(this, Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_3__["default"])(DateRange).apply(this, arguments));
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(DateRange, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          start = _this$props.start,
          end = _this$props.end,
          format = _this$props.format,
          separator = _this$props.separator,
          className = _this$props.className;
      return react__WEBPACK_IMPORTED_MODULE_6___default.a.createElement("span", {
        className: classnames__WEBPACK_IMPORTED_MODULE_9___default()(_DateRange_scss__WEBPACK_IMPORTED_MODULE_12___default.a.dateRange, className),
        __source: {
          fileName: _jsxFileName,
          lineNumber: 34
        },
        __self: this
      }, start.toLocaleDateString("en-US", format), separator, end ? end.toLocaleDateString("en-US", format) : "Present");
    }
  }]);

  return DateRange;
}(react__WEBPACK_IMPORTED_MODULE_6___default.a.Component);

Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_5__["default"])(DateRange, "propTypes", {
  className: prop_types__WEBPACK_IMPORTED_MODULE_10__["string"],
  start: Object(prop_types__WEBPACK_IMPORTED_MODULE_10__["instanceOf"])(Date).isRequired,
  end: Object(prop_types__WEBPACK_IMPORTED_MODULE_10__["instanceOf"])(Date),
  format: _shapes_dateFormatShape__WEBPACK_IMPORTED_MODULE_11__["default"],
  separator: prop_types__WEBPACK_IMPORTED_MODULE_10__["string"]
});

Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_5__["default"])(DateRange, "defaultProps", {
  className: null,
  format: DEFAULT_FORMAT,
  separator: " - "
});

/* harmony default export */ __webpack_exports__["default"] = (DateRange);

/***/ })

})
//# sourceMappingURL=index.js.a449d5f02b158a35ccf7.hot-update.js.map