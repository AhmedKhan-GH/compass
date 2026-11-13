library ieee;
    use ieee.std_logic_1164.all;
    use ieee.numeric_std.all;

package weather_pkg is type weather_report_t is record
        temperature :integer range -128 to 127; humidity:natural range 0 to 100; valid:std_logic;
    end record weather_report_t; function pack (
        r:weather_report_t
    ) return std_logic_vector; function unpack (
        w:std_logic_vector(15 downto 0)
    ) return weather_report_t; end package weather_pkg;

package body weather_pkg is function pack (
        r:weather_report_t
    ) return std_logic_vector is variable w : std_logic_vector(15 downto 0); begin w(15 downto 8) :=std_logic_vector(to_signed(r.temperature, 8)); w(7 downto 1) :=std_logic_vector(to_unsigned(r.humidity, 7)); w(0) := r.valid; return w; end function pack; function unpack (
        w:std_logic_vector(15 downto 0)
    ) return weather_report_t is variable r : weather_report_t; begin r.temperature :=to_integer(signed(w(15 downto 8))); r.humidity :=to_integer(unsigned(w(7 downto 1))); r.valid :=w(0); return r; end function unpack; end package body weather_pkg;
