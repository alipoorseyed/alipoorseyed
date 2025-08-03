import { ArrowLeft } from "iconsax-reactjs";
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import Select from "react-select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import customStyles from "../../../public/styles/teacher-panel/SelectBar";

const StudentProgress = () => {
  const location = useLocation();
  const lesson = location.state;
  
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Persian month names mapping
  const persianMonths = {
    "January": "دی",
    "February": "بهمن", 
    "March": "اسفند",
    "April": "فروردین",
    "May": "اردیبهشت",
    "June": "خرداد",
    "July": "تیر",
    "August": "مرداد",
    "September": "شهریور",
    "October": "مهر",
    "November": "آبان",
    "December": "آذر"
  };

  // Flatten topics to include all topics and sub-topics
  const getAllTopics = (topics) => {
    let allTopics = [];
    
    const extractTopics = (topicArray) => {
      topicArray.forEach(topic => {
        allTopics.push({
          id: topic.id,
          name: topic.name
        });
        
        if (topic.subSubject && topic.subSubject.length > 0) {
          extractTopics(topic.subSubject);
        }
      });
    };
    
    extractTopics(topics);
    return allTopics;
  };

  // Get topic options for select
  const getTopicOptions = () => {
    if (!lesson?.topics) return [];
    
    const allTopics = getAllTopics(lesson.topics);
    return allTopics.map(topic => ({
      value: topic.id,
      label: topic.name
    }));
  };

  // Fetch students on component mount
  useEffect(() => {
    if (lesson?.classId) {
      fetchStudents();
    }
  }, [lesson]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(
        `https://test1.sanjehplus.ir/api/School/GetClassStudents?classId=${lesson.classId}&page=1&pageSize=100`
      );
      const data = await response.json();
      
      if (data.statusCode === 200) {
        const studentOptions = data.data.students.map(student => ({
          value: student.id,
          label: student.studentName
        }));
        setStudents(studentOptions);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('خطا در دریافت لیست دانش‌آموزان');
    }
  };

  const fetchProgressData = async () => {
    if (!selectedStudent || !selectedTopic) {
      toast.error('لطفاً دانش‌آموز و هدف را انتخاب کنید');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://test1.sanjehplus.ir/api/Exam/GetTopicEvaluationDetailStats?studentId=${selectedStudent.value}&topicId=${selectedTopic.value}`
      );
      const data = await response.json();
      
      if (data.statusCode === 200) {
        // Transform data for chart
        const transformedData = data.data.map(item => ({
          month: persianMonths[item.monthName] || item.monthName,
          percentage: item.positivePercentage,
          yearMonth: item.yearMonth
        }));
        
        // Group by month and get latest data for each month
        const monthlyData = {};
        transformedData.forEach(item => {
          const monthKey = item.month;
          if (!monthlyData[monthKey] || monthlyData[monthKey].yearMonth < item.yearMonth) {
            monthlyData[monthKey] = item;
          }
        });
        
        // Create chart data for all 12 Persian months
        const allMonths = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
        const chartDataArray = allMonths.map(month => ({
          month,
          percentage: monthlyData[month]?.percentage || 0
        }));
        
        setChartData(chartDataArray);
        toast.success('داده‌ها با موفقیت بارگذاری شد');
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast.error('خطا در دریافت داده‌های پیشرفت');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    fetchProgressData();
  };

  const handleReset = () => {
    setSelectedStudent(null);
    setSelectedTopic(null);
    setChartData([]);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-[#5E626E] font-medium">{`${label}: ${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };

  console.log(lesson);
  
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <div className="min-h-screen bg-[#FCFCFD] pt-6 px-4 md:px-28 pb-20">
        <div className="w-full relative">
          <h1 className="text-gray-650 font-semibold text-3xl text-center max-md:text-2xl">
            سیر پیشرفت دانش آموزان
          </h1>
          <Link
            to={"/p-teacher/Sanjesh"}
            className="flex justify-center items-center gap-2 absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer hover:gap-3 transition-all duration-200"
          >
            <p className="text-sm font-medium text-gray-250 hover:text-gray-600 max-sm:hidden">
              بازگشت
            </p>
            <ArrowLeft size={16} variant="outline" color="#5E626E" />
          </Link>
        </div>

        <div className="w-full h-[1px] bg-secondary-LIGHT mt-4 mb-6"></div>
        <div className="flex justify-between items-center">
          <div className="flex justify-center items-center gap-3 text-nowrap">
            <Select
              placeholder="نام دانش آموز"
              styles={customStyles}
              isSearchable={false}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              className="mt-1"
              options={students}
              value={selectedStudent}
              onChange={setSelectedStudent}
            />
            <Select
              placeholder="هدف"
              styles={customStyles}
              isSearchable={false}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              className="mt-1"
              options={getTopicOptions()}
              value={selectedTopic}
              onChange={setSelectedTopic}
            />
          </div>
          <div className="hidden md:flex justify-center items-center gap-3">
            <button 
              onClick={handleApply}
              disabled={loading}
              className="text-bace-white bg-primary text-base font-medium w-36 py-3 rounded-3xl disabled:opacity-50"
            >
              {loading ? 'در حال بارگذاری...' : 'اعمال'}
            </button>
            <button 
              onClick={handleReset}
              className="text-[#5C5854] bg-[#EBE9E7] text-base font-medium w-36 py-3 rounded-3xl"
            >
              بازنشانی
            </button>
          </div>
        </div>

        <div className="w-full h-[1px] bg-secondary-LIGHT mt-6 mb-8"></div>
        
        {/* Chart Container */}
        <div className="w-full bg-white rounded-lg p-6 shadow-sm">
          {chartData.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="text-[#172B4CE5] font-medium text-lg">
                  نمودار پیشرفت دانش آموز
                </div>
                <div className="text-[#99A1B7] font-medium">
                  جواب صحیح (%)
                </div>
              </div>
              
              <div className="w-full h-96 md:h-[500px] overflow-x-auto">
                <div className="min-w-[600px] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#00000033" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: '#000000B2', fontSize: 12 }}
                        axisLine={{ stroke: '#000000B2' }}
                        tickLine={{ stroke: '#000000B2' }}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tick={{ fill: '#000000B2', fontSize: 12 }}
                        axisLine={{ stroke: '#000000B2' }}
                        tickLine={{ stroke: '#000000B2' }}
                        label={{ value: 'درصد (%)', angle: 90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#000000B2' } }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      
                      {/* Background bars */}
                      <Bar 
                        dataKey={() => 100}
                        fill="#D6DBED66"
                        radius={[4, 4, 0, 0]}
                      />
                      
                      {/* Main progress bars */}
                      <Bar 
                        dataKey="percentage" 
                        fill="var(--primary-color, #3B82F6)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-[#99A1B7] text-sm">
                  دقت کنید که آمار نشان داده شده فقط مربوط به هدف انتخاب شده است.
                </p>
              </div>
            </>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500">
              <p>برای مشاهده نمودار، دانش‌آموز و هدف را انتخاب کرده و دکمه اعمال را بزنید</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile buttons */}
      <div className="w-full bg-white py-5 px-4 flex md:hidden justify-center items-center gap-4">
        <button 
          onClick={handleApply}
          disabled={loading}
          className="text-bace-white bg-primary text-base font-medium w-full py-3 rounded-3xl disabled:opacity-50"
        >
          {loading ? 'در حال بارگذاری...' : 'اعمال'}
        </button>
        <button 
          onClick={handleReset}
          className="text-[#5C5854] bg-[#EBE9E7] text-base font-medium w-full py-3 rounded-3xl"
        >
          بازنشانی
        </button>
      </div>
    </>
  );
};

export default StudentProgress;