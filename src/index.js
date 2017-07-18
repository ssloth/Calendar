(function($) {
  var Calendar = (function() {
    function Calendar(element, options) {
      this.current = { year: null, month: null, havePre: false, haveNext: false };
      this.settings = $.extend(true, $.fn.Calendar.defaults, options || {});
      this.element = element;
      this.init();
    }

    Calendar.prototype = {
      /**
       * 初始化插件
       */
      init: function() {
        var me = this;
        me.myData = new Date();
        me.current.year = me.myData.getFullYear();
        me.current.month = me.myData.getMonth() + 1;
        me.activeDay = { y: null, m: null, d: null };
        me.barState = true;
        me.tableHeight = $('body').height();
        me.weekmarginLeft = 0;
        me.activeRow = 0;
        me.writeDateByMonth();
        me._initEvent();
      },

      /**
       * 读取年月日写入日历 月历
       */
      writeDateByMonth: function() {
        var me = this;
        var yyyy = this.current.year;
        var mm = this.current.month;
        me.dd = new Date(parseInt(yyyy), parseInt(mm), 0); //Wed Mar 31 00:00:00 UTC+0800 2010
        me.daysCount = me.dd.getDate(); //本月天数
        me.bodyHtml = "";
        me.current.haveNext = false;
        me.current.havePre = false;
        me.activeRow = 0;

        var week = me.getFirstDay(me.current.year, me.current.month); //周
        if (week === 0) {
          console.log(me.current)
        }
        var lastMonth; //上一月天数
        var nextMouth; //下一月天数

        if (parseInt(mm) == 1) {
          lastMonth = new Date(parseInt(yyyy) - 1, parseInt(12), 0).getDate();
        } else {
          lastMonth = new Date(parseInt(yyyy), parseInt(mm) - 1, 0).getDate();
        }
        if (parseInt(mm) == 12) {
          nextMouth = new Date(parseInt(yyyy) + 1, parseInt(1), 0).getDate();
        } else {
          nextMouth = new Date(parseInt(yyyy), parseInt(mm) + 1, 0).getDate();
        }

        var count = 0;

        var nextm = me.current.month === 12 ? 1 : me.current.month + 1;
        var nexty = nextm == 1 ? me.current.year + 1 : me.current.year;
        var prem = me.current.month === 1 ? 12 : me.current.month - 1;
        var prey = prem == 12 ? me.current.year - 1 : me.current.year;

        me.bodyHtml += '<div class="row">';
        //计算上月空格数
        var lastMonthArray = [];

        for (var i = 0; i < week - 1; i++) {
          lastMonthArray.unshift(lastMonth - i);
          me.current.havePre = true;
        }

        for (var i = 0; i < me.daysCount; i++) {
          if (i % 7 == 0) {
            //只执行一次
            if (i < 7) {
              for (var j = 0; j < lastMonthArray.length; j++) {
                me.bodyHtml += '<div data-id=' + prey + '-' + prem + '-' + lastMonthArray[j] + ' class="item null">' + lastMonthArray[j] + '</div>';
                count++;
                if (count % 7 === 0) {
                  me.bodyHtml += '</div>';
                  me.bodyHtml += '<div class="row">'
                }
              }
            }
          }
          me.bodyHtml += '<div data-id=' + me.current.year + '-' + me.current.month + '-' + (i + 1) + ' class="item">' + (i + 1) + "</div>";
          count++;
          if (count % 7 === 0) {
            me.bodyHtml += '</div>';
            me.bodyHtml += '<div class="row">'
          }
        }

        //计算下月空格数,表格不等高，只补充末行不足单元格
        if (7 - (me.daysCount + week - 1) % 7 < 7 && 0 !== (me.daysCount + week - 1) % 7) {
          for (var k = 0; k < 7 - (me.daysCount + week - 1) % 7; k++) {
            me.current.haveNext = true;
            me.bodyHtml += '<div data-id=' + nexty + '-' + nextm + '-' + (k + 1) + ' class="item null">' + (k + 1) + '</div>';
            count++;
            if (count % 7 === 0) {
              me.bodyHtml += '</div>';
            }
          }
        }
        this.reader();
        me.rows = me._getRow();
        me._addActiveClass();
      },

      /**
       * 渲染DOM
       */
      reader: function() {
        $('.body').html(this.bodyHtml);
        $('.today').html(this.current.month + '月' + this.current.year);
        this._get_focus_class();
      },

      /**
       * 切换到下一月
       */
      switchNextMonth: function() {
        if (this.current.month == 12) {
          this.current.year++;
          this.current.month = 1;
        } else {
          this.current.month++;
        }
        this.writeDateByMonth();
        this.reader();
      },

      /**
       * 切换到上一月
       */
      switchPreMonth: function() {
        if (this.current.month == 1) {
          this.current.year--;
          this.current.month = 12;
        } else {
          this.current.month--;
        }
        this.writeDateByMonth();
        this.reader();
      },

      /**
       * 改变布局为月历
       */
      changeLayoutToMonth: function() {
        var me = this;
        $('.body').removeClass().addClass('body  body-month');
        $('.row').removeClass().addClass('row  row-month');
        $('.row:first').css({ 'margin-left': 0 });
        me._addActiveClass();
      },

      /**
       * 改变布局为周历
       */
      changeLayoutToWeek: function() {
        var me = this;
        var unit = 100 / me.rows;
        $('.body').removeClass().addClass('body body-week body-week-' + me.rows);
        $('.row').removeClass().addClass('row row-week row-week-' + me.rows);
        console.log(me._get_today());
        console.log(me.activeRow)
        if (!me.activeRow && me._get_today()) {

          me.weekmarginLeft = -unit * me._get_today()
        } else {
          me.weekmarginLeft = -unit * me.activeRow;
        }
        $('.row:first').css({
          'margin-left': me.weekmarginLeft + '%'
        })
      },

      /**
       * 月历左移动画
       */
      moveLeftAnimation: function() {
        $('.body').animate({
          'margin-left': '100%'
        }, function() {
          $('.body').css({ 'margin-left': 0 })
        })
      },

      /**
       * 月历右移动画
       */
      moveRightAnimation: function() {
        $('.body').animate({
          'margin-left': '-100%'
        }, function() {
          $('.body').css({ 'margin-left': 0 })
        })
      },

      /**
       * 周历左移动画 + 切换
       */
      moveLeftAnimationWeek: function() {
        var me = this;
        var unit = 100 / me.rows;
        me.weekmarginLeft -= unit;
        var mm = me.current.month;
        var yyyy = me.current.year;
        if ((mm + 1) == 1) {
          mm = 12;
          yyyy--;
        }
        if (me.weekmarginLeft <= -100) {
          if (-100 !== parseInt(me.weekmarginLeft) || !me._isEmpty()) {
            me.switchNextMonth();
            me.changeLayoutToWeek(yyyy, mm);
            if (me.current.havePre) {
              me.weekmarginLeft = -100 / me.rows;
            } else {
              me.weekmarginLeft = 0;
            }
          }
        }
        $('.row:first').animate({
          'margin-left': me.weekmarginLeft + '%'
        })
      },

      /**
       * 周历右移动画 + 切换
       */
      moveRightAnimationWeek: function() {
        var me = this;
        var unit = 100 / me.rows;
        var mm = me.current.month;
        var yyyy = me.current.year;
        if ((mm + 1) == 12) {
          mm = 0;
          yyyy++;
        }
        me.weekmarginLeft += unit;
        if (me.weekmarginLeft >= 0) {
          me.switchPreMonth();
          me.changeLayoutToWeek();
          if (!me.current.haveNext) {
            me.weekmarginLeft = -100 + 2 * (100 / me.rows);
          } else {
            me.weekmarginLeft = -100 + 100 / me.rows;
          }
        }
        $('.row:first').animate({
          'margin-left': me.weekmarginLeft + '%'
        })
      },

      /**
       * 展开动画 +改变布局
       */
      unfoldAnimation: function() {
        var me = this;
        me.barState = true;
        me.changeLayoutToMonth();
        $('.body').animate({
          height: 240
        })
      },

      /**
       * 折叠动画 +改变布局
       */
      foldAnimation: function() {
        var me = this;
        me.barState = false;
        $('.body').animate({
          height: 40
        }, me.changeLayoutToWeek());
      },

      /**
       * 获取某年某月的第一天
       * @param _year
       * @param _month
       * @returns {number}
       * @private
       */
      getFirstDay: function(_year, _month) {
        return new Date(_year, _month - 1, 1).getDay() || 7;
      },

      /**
       * 初始化事件
       * @private
       */
      _initEvent: function() {
        var me = this;
        me.touchStartX = 0;
        me.touchStartY = 0;
        $('.bar').on('click', function() {
          if (!me.barState) {
            me.unfoldAnimation();
          } else {
            me.foldAnimation();
          }
        });
        $('.to-today').on('click', function() {
            me.current.year = me.myData.getFullYear();
            me.current.month = me.myData.getMonth() + 1;
            me.writeDateByMonth();
            me.foldAnimation();
          })
          //手指接触屏幕
        $('#table')[0].addEventListener("touchstart", function(e) {
          me.touchStartX = e.touches[0].pageX;
          me.touchStartY = e.touches[0].pageY;
        }, false);
        //手指离开屏幕
        $('#table')[0].addEventListener("touchend", function(e) {
          var endx, endy;
          endx = e.changedTouches[0].pageX;
          endy = e.changedTouches[0].pageY;
          var direction = getDirection(endx, endy);
          switch (direction) {
            case 0:
              console.log('未滑动');
              break;
            case 1:
              if (me.barState) {
                me.foldAnimation();
              }
              break;
            case 2:
              if (!me.barState) {
                me.unfoldAnimation();
              }
              break;
            case 3: //向左
              if (me.barState) {
                //切换下月
                me.switchNextMonth();
                me.moveRightAnimation();
              } else {
                //切换下周
                me.moveLeftAnimationWeek();
              }
              break;
            case 4: //向右
              if (me.barState) {
                //切换下月
                me.moveLeftAnimation();
                me.switchPreMonth();
              } else {
                //切换下周
                me.moveRightAnimationWeek();
              }
              break;
            default:
          }
        }, false);

        function getAngle(angx, angy) {
          return Math.atan2(angy, angx) * 180 / Math.PI;
        };
        //根据起点终点返回方向 1向上 2向下 3向左 4向右 0未滑动
        function getDirection(endx, endy) {
          var angx = endx - me.touchStartX;
          var angy = endy - me.touchStartY;
          var result = 0;
          //如果滑动距离太短
          if (Math.abs(angx) < 5 && Math.abs(angy) < 5) {
            return result;
          }
          var angle = getAngle(angx, angy);
          if (angle >= -135 && angle <= -45) {
            result = 1;
          } else if (angle > 45 && angle < 135) {
            result = 2;
          } else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
            result = 3;
          } else if (angle >= -45 && angle <= 45) {
            result = 4;
          }
          return result;
        }
      },

      /**
       *  焦点事件
       */
      _get_focus_class: function() {
        var rows = $('.row');
        var me = this;
        $('.item').on('click', function() {
          $('.item').removeClass('active');
          $(this).addClass('active');
          me.activeDay.y = me.current.year;
          me.activeDay.m = me.current.month;
          me.activeDay.d = parseInt($(this).html());
          for (var i = 0; i < rows.length; i++) {
            if ($(rows[i]).find('.active').length !== 0) {
              me.activeRow = i;
              return i;
            }
          }
        })
      },

      _get_today: function() {
        var rows = $('.row');
        var me = this;
        for (var i = 0; i < rows.length; i++) {
          if ($(rows[i]).find('.today').length !== 0) {
            return i;
          }
        }
      },

      /**
       * 判断是否为闰年
       * @param _year
       * @returns {boolean}
       * @private
       */
      _runNian: function(_year) {
        return !!(_year % 400 === 0 || (_year % 4 === 0 && _year % 100 !== 0));
      },

      /**
       * 判断行数
       * @returns {number}
       * @private
       */
      _getRow: function() {
        return $('.row').length - $('.row:empty').length;
      },

      /**
       * 为今天的日期高亮
       * @private
       */
      _addActiveClass: function() {
        var me = this;
        if (me.myData.getFullYear() == this.current.year) {
          if ((me.myData.getMonth() + 1) == this.current.month) {
            var today = me.myData.getDate();
            $('.item:contains(' + today + ')').addClass('today');
          }
        }

        // if (me.current.year == me.activeDay.y && me.current.month == me.activeDay.m) {
        //   console.log(me.activeDay.d);
        //   $('.item:contains(' + me.activeDay.d + ')').addClass('active');
        // }
      },

      /**
       * 判断是否有空行
       */
      _isEmpty: function() {
        return $('.row:last') == null;
      }
    };
    return Calendar;
  })();
  /**
   * 实现单例模式
   */
  $.fn.Calendar = function(options) {
    return this.each(function() {
      var me = $(this),
        instance = me.data('Calendar');
      if (!instance) {
        instance = new Calendar(me, options);
        me.data('Calendar', instance);
      }
      if ($.type(options) === 'string') return instance[options]();
    })
  };
  /**
   * 默认配置
   */
  $.fn.Calendar.defaults = {}
})(jQuery);
