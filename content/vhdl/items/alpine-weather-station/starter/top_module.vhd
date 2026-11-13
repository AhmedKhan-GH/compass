library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(packet:in std_logic_vector(15 downto 0);
    calibration:in std_logic_vector(7 downto 0);
    temperature,calibrated_temperature:out signed(9 downto 0);
    display_millidegrees:out signed(19 downto 0));
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    signal temp,cal:signed(9 downto 0);
    begin
    temp<=signed(resize(unsigned(packet(7 downto 0)),10));
    cal<=temp+signed(resize(unsigned(calibration),10));
    temperature<=temp;
    calibrated_temperature<=cal;
    display_millidegrees<=resize(cal*to_signed(1000,11),20);
end architecture;
