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
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/assertThisInitialized */ "./node_modules/@babel/runtime-corejs2/helpers/esm/assertThisInitialized.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/defineProperty */ "./node_modules/@babel/runtime-corejs2/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var duration__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! duration */ "./node_modules/duration/index.js");
/* harmony import */ var duration__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(duration__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var pluralize__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! pluralize */ "./node_modules/pluralize/pluralize.js");
/* harmony import */ var pluralize__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(pluralize__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! classnames */ "./node_modules/classnames/index.js");
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_11__);
/* harmony import */ var _shapes_dateFormatShape__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../../shapes/dateFormatShape */ "./shapes/dateFormatShape.js");
/* harmony import */ var _DateRange_scss__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./DateRange.scss */ "./components/Resume/DateRange/DateRange.scss");
/* harmony import */ var _DateRange_scss__WEBPACK_IMPORTED_MODULE_13___default = /*#__PURE__*/__webpack_require__.n(_DateRange_scss__WEBPACK_IMPORTED_MODULE_13__);







var _jsxFileName = "/Users/mhuggins/Development/matthuggins.com/components/Resume/DateRange/DateRange.js";







var DEFAULT_FORMAT = {
  year: "numeric",
  month: "short"
};

var DateRange =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_5__["default"])(DateRange, _React$Component);

  function DateRange() {
    var _getPrototypeOf2;

    var _this;

    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, DateRange);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_2__["default"])(this, (_getPrototypeOf2 = Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_3__["default"])(DateRange)).call.apply(_getPrototypeOf2, [this].concat(args)));

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_4__["default"])(_this), "renderDuration", function () {
      if (!_this.props.showDuration) {
        return null;
      }

      return react__WEBPACK_IMPORTED_MODULE_7___default.a.createElement(react__WEBPACK_IMPORTED_MODULE_7___default.a.Fragment, {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 49
        },
        __self: this
      }, " ", "(", _this.getDuration(), ")");
    });

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_4__["default"])(_this), "getDuration", function () {
      var _ref = new duration__WEBPACK_IMPORTED_MODULE_8___default.a(_this.props.start, _this.props.end || new Date()),
          year = _ref.year,
          month = _ref.month;

      var parts = [];

      if (year > 0) {
        parts.push(pluralize__WEBPACK_IMPORTED_MODULE_9___default()("yr", year, true));
      }

      if (month > 0) {
        parts.push(pluralize__WEBPACK_IMPORTED_MODULE_9___default()("mo", month, true));
      }

      return parts.join(" ");
    });

    return _this;
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(DateRange, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          start = _this$props.start,
          end = _this$props.end,
          format = _this$props.format,
          className = _this$props.className;
      return react__WEBPACK_IMPORTED_MODULE_7___default.a.createElement("span", {
        className: classnames__WEBPACK_IMPORTED_MODULE_10___default()(_DateRange_scss__WEBPACK_IMPORTED_MODULE_13___default.a.dateRange, className),
        __source: {
          fileName: _jsxFileName,
          lineNumber: 34
        },
        __self: this
      }, start.toLocaleDateString("en-US", format), " - ", end ? end.toLocaleDateString("en-US", format) : "Present", this.renderDuration());
    }
  }]);

  return DateRange;
}(react__WEBPACK_IMPORTED_MODULE_7___default.a.Component);

Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__["default"])(DateRange, "propTypes", {
  className: prop_types__WEBPACK_IMPORTED_MODULE_11__["string"],
  start: Object(prop_types__WEBPACK_IMPORTED_MODULE_11__["instanceOf"])(Date).isRequired,
  end: Object(prop_types__WEBPACK_IMPORTED_MODULE_11__["instanceOf"])(Date),
  format: _shapes_dateFormatShape__WEBPACK_IMPORTED_MODULE_12__["default"],
  showDuration: prop_types__WEBPACK_IMPORTED_MODULE_11__["bool"]
});

Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_6__["default"])(DateRange, "defaultProps", {
  className: null,
  format: DEFAULT_FORMAT,
  showDuration: false
});

/* harmony default export */ __webpack_exports__["default"] = (DateRange);

/***/ })

})
//# sourceMappingURL=index.js.86431156fb4e3095c4f1.hot-update.js.map